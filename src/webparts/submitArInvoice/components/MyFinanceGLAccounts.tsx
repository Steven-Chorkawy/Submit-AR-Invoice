import * as React from 'react';
import * as ReactDom from 'react-dom';


//PnPjs Imports
import { sp } from "@pnp/sp";
import { Web } from "@pnp/sp/webs";
import "@pnp/sp/webs";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/lists";
import "@pnp/sp/items";


import { Field } from '@progress/kendo-react-form';
import { NumericTextBox, Checkbox, MaskedTextBox } from '@progress/kendo-react-inputs';
import { Grid, GridColumn, GridToolbar } from '@progress/kendo-react-grid';
import { Button } from '@progress/kendo-react-buttons';
import { Card, CardTitle, CardSubtitle, CardBody } from '@progress/kendo-react-layout';
import { ListView, ListViewHeader } from '@progress/kendo-react-listview';
import { DropDownList } from '@progress/kendo-react-dropdowns';

import * as MyValidators from './validators.jsx';
import * as MyFormComponents from './MyFormComponents';
import { MyCommandCell } from './FinanceForms/MyCommandCell';
import { MyLists } from './enums/MyLists.js';
import { MyContentTypes } from './enums/MyEnums.js';
import { IARAccountDetails } from './MyKendoForm.js';
import { IARInvoiceAccount } from './interface/IARInvoiceAccount';


//#region  Cell Functions

/**
 * Calculate HST this current row.
 *
 * @param props Grid properties.
 */
const CalculateHSTAmount = (props) => {
  return (props.dataItem.HSTTaxable == true) ? props.dataItem.Amount * 0.13 : 0;
};

const glCodeCell = (props) => {
  const { dataItem, field } = props;
  const dataValue = dataItem[field] === null ? '' : dataItem[field];
  const handleChange = React.useCallback(
    (e) => {
      props.onChange({
        dataItem: props.dataItem,
        field: props.field,
        syntheticEvent: e.syntheticEvent,
        value: e.target.value
      });
    },
    [props.onChange]
  );

  return (
    <td>
      {dataItem.inEdit ? (
        <Field
          mask="000-00-000-00000-0000"
          component={MyFormComponents.FormMaskedTextBox}
          validator={e => MyValidators.glCodeValidator(dataValue)}
          name={`GLAccounts[${props.dataIndex}].${props.field}`}
          onChange={handleChange}
          value={dataValue}
        />
      ) : (
          dataValue
        )}
    </td>
  );
};

/**
 * Amount before HST.
 * @param props Grid properties.
 */
const amountCell = (props) => {
  const { dataItem, field } = props;
  const dataValue = dataItem[field] === null ? '' : dataItem[field];
  const handleChange = React.useCallback(
    (e) => {
      props.onChange({
        dataItem: props.dataItem,
        field: props.field,
        syntheticEvent: e.syntheticEvent,
        value: e.target.value
      });
    },
    [props.onChange]
  );

  return (
    <td>
      {dataItem.inEdit ? (
        <Field
          format="c2"
          component={MyFormComponents.FormNumericTextBox}
          validator={e => MyValidators.accountAmountValidator(dataValue)}
          name={`GLAccounts[${props.dataIndex}].${props.field}`}
          value={dataValue}
          editable={true}
          disabled={false}
          onChange={handleChange}
        />
      ) : (
          <NumericTextBox
            defaultValue={dataValue}
            format="c2"
            disabled={true}
          />
        )}
    </td>
  );
};


/**
 * Total Amount including HST.
 * Amount + HST Amount
 * @param props Grid properties.
 */
const totalInvoiceCell = (props) => {
  const { dataItem, field } = props;
  let dataValue = dataItem[field] === null ? '' : dataItem[field];
  let calculatedAmount: Number = CalculateHSTAmount(props) + dataItem.Amount;

  // dataValue is undefined when it is a new invoice.  
  //This is because the TotalInvoice field is populated from SharePoint, and we have yet to receive the response from SharePoint. 
  if (dataValue === undefined && field === 'TotalInvoice') {
    dataValue = calculatedAmount;
  }

  return (
    <td>
      {dataItem.inEdit ? (
        <Field
          format="c2"
          component={NumericTextBox}
          name='TotalInvoice'
          readonly={true}
          disabled={true}
          value={
            (props.dataItem.Amount === null) ? 0 : calculatedAmount
          }
        />
      ) : (
          <NumericTextBox
            value={Number(Number(dataValue).toFixed(2))}
            format="c2"
            disabled={true}
          />
        )}
    </td>
  );
};


/**
 * Boolean, Does HST Apply?
 * @param props Grid Properties
 */
const hstTaxableCell = (props) => {
  const { dataItem, field } = props;
  const dataValue = dataItem[field] === null ? '' : dataItem[field];
  return (
    <td>
      {dataItem.inEdit ? (
        <Field
          component={Checkbox}
          name={`GLAccounts[${props.dataIndex}].${props.field}`}
          value={dataValue}
        />
      ) : (
          dataValue ? "Yes" : "No"
        )}
    </td>
  );
};


/**
 * HST Calculated from Amount.
 * HST = Amount * 0.13
 * EX: $1,000 * 0.13 = $130
 * @param props Grid Properties
 */
const hstCell = (props) => {
  const { dataItem, field } = props;
  const dataValue = dataItem[field] === null ? '' : dataItem[field];
  return (
    <td>
      <NumericTextBox
        // defaultValue={CalculateHSTAmount(props)}
        value={CalculateHSTAmount(props)}
        format="c2"
        disabled={true}
      />
    </td>
  );
};
//#endregion


export class MyFinanceGlAccounts extends React.Component<any, any> {
  public editField = "inEdit";
  public CommandCell;

  constructor(props) {
    super(props);
    debugger;

    if (!props.hasOwnProperty('value'))
      props.value = [];

    let dataObject = this._mapAccountsForState();

    this.state = {
      data: dataObject,
      // same as data but we use this to reset state.
      receivedData: dataObject
    };

    this.CommandCell = MyCommandCell({
      edit: this.enterEdit,
      remove: this.remove,

      add: this.add,
      discard: this.discard,

      update: this.update,
      cancel: this.cancel,

      editField: this.editField
    });
  }

  private _mapAccountsForState() {
    return this.props.value.map(a => (
      {
        InvoiceID: a.AR_x0020_InvoiceId,
        RequestId: a.AR_x0020_Invoice_x0020_RequestId,
        ID: a.ID,
        GLCode: a.Account_x0020_Code,
        Amount: a.Amount,
        HSTTaxable: a.HST_x0020_Taxable,
        HST: a.HST,
        TotalInvoice: a.Total_x0020_Invoice,
        inEdit: a.inEdit
      }
    ));
  }

  public componentDidMount() {
    let data = this._mapAccountsForState();

    this.setState({
      data: data
    });
  }

  //#region CRUD Methods
  public enterEdit = (dataItem) => {
    this.setState({
      data: this.state.data.map(item => item.ID === dataItem.ID ? { ...item, inEdit: true } : item)
    });
  }

  public add = (dataItem) => {
    if (dataItem.Amount === "" || dataItem.Amount === 0) {
      alert("Please Enter a valid amount");
      return;
    }

    if (dataItem.GLCode == undefined || dataItem.GLCode.includes('_')) {
      alert('Please Enter a valid G/L Account #');
      return;
    }

    dataItem.inEdit = undefined;
    let isInvoice: boolean = this.props.productInEdit.ContentTypeId === MyContentTypes["AR Invoice Document Item"];

    let invoiceId = isInvoice
      ? this.props.productInEdit.ID
      : null;

    let requestId = !isInvoice
      ? this.props.productInEdit.ID
      : this.props.productInEdit.AR_x0020_Invoice_x0020_RequestId;

    let newAccount: IARInvoiceAccount = {
      AR_x0020_InvoiceId: invoiceId,
      AR_x0020_Invoice_x0020_RequestId: requestId,
      Account_x0020_Code: dataItem.GLCode,
      Amount: dataItem.Amount,
      HST_x0020_Taxable: dataItem.HSTTaxable
    };

    // TODO: Add the account code.
    sp.web.lists.getByTitle(MyLists["AR Invoice Accounts"])
      .items.add(newAccount)
      .then(res => {
        if (this.props.updateAccountDetails) {
          this.props.updateAccountDetails([{
            Amount: res.data.Amount,
            GLCode: res.data.Account_x0020_Code,
            HST: res.data.HST,
            HSTTaxable: res.data.HST_x0020_Taxable,
            ID: res.data.ID,
            InvoiceID: res.data.AR_x0020_InvoiceId,
            RequestId: res.data.AR_x0020_Invoice_x0020_RequestId,
            TotalInvoice: res.data.Total_x0020_Invoice
          }]);
        }
      });

    // TODO: Update the Request or Invoice.

    this.setState({
      data: [...this.state.data]
    });
  }

  public update = (dataItem) => {
    const data = [...this.state.data];
    const updatedItem = { ...dataItem, inEdit: undefined };
    sp.web.lists.getByTitle('AR Invoice Accounts').items.getById(dataItem.ID)
      .update({
        Account_x0020_Code: updatedItem.GLCode,
        Amount: updatedItem.Amount,
        HST_x0020_Taxable: updatedItem.HSTTaxable
      })
      .then(f => {
        this.updateItem(data, updatedItem);
        this.updateItem(this.state.receivedData, updatedItem);

        if (this.props.updateAccountDetails) {
          this.props.updateAccountDetails(data);
        }

        this.setState({ data: data });
      });
  }

  /**
   * Update objects found in state.
   * @param data State Object
   * @param item Item that we will update in state.
   */
  public updateItem = (data, item) => {
    let index = data.findIndex(p => p === item || (item.ID && p.ID === item.ID));
    if (index >= 0) {
      data[index] = { ...item };
    }
  }

  public cancel = (dataItem) => {
    const originalItem = this.state.receivedData.find(p => p.ID === dataItem.ID);
    const data = this.state.data.map(item => item.ID === originalItem.ID ? originalItem : item);

    this.setState({ data });
  }

  public discard = (dataItem) => {
    const data = [...this.state.data];
    this.removeItem(data, dataItem);

    this.setState({ data });
  }

  public remove = (dataItem) => {
    const data = [...this.state.data];
    this.removeItem(data, dataItem);
    //this.removeItem(sampleProducts, dataItem);

    this.setState({ data });
  }

  public itemChange = (event) => {
    const data = this.state.data.map(item => item.ID === event.dataItem.ID ? { ...item, [event.field]: event.value } : item);
    this.setState({ data });
  }

  public addNew = () => {
    this.setState({
      data: [
        {
          ID: 911,
          GLCode: '',
          Amount: '',
          HSTTaxable: false,
          inEdit: true
        },
        ...this.state.data
      ]
    });
  }

  public cancelCurrentChanges = () => {
    this.setState({ data: [...this.state.receivedData] });
  }
  //#endregion

  public render() {
    const { data } = this.state;
    const hasEditedItem = data.some(p => p.inEdit);

    return (
      <Grid
        data={data}
        resizable={true}
        onItemChange={this.itemChange}
        editField={this.editField}
        style={...this.props.style}
      >
        <GridToolbar>
          <button
            title="Add new"
            className="k-button k-primary"
            onClick={this.props.onAdd}
          >Add new</button>
          {hasEditedItem && (
            <button
              title="Cancel current changes"
              className="k-button"
              onClick={this.cancelCurrentChanges}
            >
              Cancel current changes
            </button>
          )}
        </GridToolbar>
        <GridColumn
          field="GLCode"
          title="G/L Account #"
          cell={glCodeCell}
          width="200px"
        />

        <GridColumn
          field="Amount"
          title="* Amount"
          cell={amountCell}
        />

        <GridColumn
          field="HSTTaxable"
          title="HST"
          //cell={hstTaxableCell}
          editor="boolean"
          width="60px"
        />

        <GridColumn
          field="HST"
          title="HST Amount"
          cell={hstCell}
        />

        <GridColumn
          field="TotalInvoice"
          title="Total Invoice"
          cell={totalInvoiceCell}
        />

        {
          (this.props.showCommandCell || this.props.showCommandCell === undefined) &&
          <GridColumn cell={this.CommandCell} width="90px" />
        }
      </Grid>
    );
  }

  public removeItem(data, item) {
    let index = data.findIndex(p => p === item || (item.ID && p.ID === item.ID));
    if (index >= 0) {
      data.splice(index, 1);
    }
  }
}

class GLAccountsListViewItemRender extends React.Component<any, any> {
  public state = {
    item: this.props.dataItem
  };
  public componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.dataItem.ProductID !== this.props.dataItem.ProductID) {
      this.setState({
        item: this.props.dataItem
      });
    }
  }
  public enterEdit = () => {
    this.setState({ item: { ...this.state.item, edit: true } });
  }
  public cancelEdit = () => {
    this.setState({ item: { ...this.state.item, edit: false } });
  }
  public handleChange = (e, field) => {
    let updatedItem = { ...this.state.item };
    updatedItem[field] = e.value;
    this.setState({ item: updatedItem });
  }
  public handleSave = () => {
    this.props.saveItem(this.state.item, (e) => {
      this.setState({ item: { ...e, edit: false } });
    });
  }
  public handleDelete = () => {
    this.props.deleteItem(this.state.item);
  }

  private _disableSaveButton = () => {
    let output = true;
    if (this.state.item.Account_x0020_Code) {
      // 111-11-111-11111-1111 is a valid account code. 
      // That's 21 characters.
      if (this.state.item.Account_x0020_Code.length === 21 && this.state.item.Amount) {
        output = false;
      }
    }
    return output;
  }

  public render() {
    const item = this.state.item;
    return (
      <div key={this.state.item.ID}>
        <Card orientation='horizontal' style={{ borderWidth: '0px 0px 1px' }}>
          {
            this.state.item.edit ?
              <CardBody>
                <div className={'row'}>
                  <div className={'col-md-10'}>
                    <div className={'row'}>
                      <div className={'col-md-6'}>
                        <label style={{ display: 'block' }}>Account Code:</label>
                        <MaskedTextBox
                          id={'Account_x0020_Code'}
                          name={'Account_x0020_Code'}
                          mask="000-00-000-00000-0000"
                          required={true}
                          value={this.state.item.Account_x0020_Code}
                          onChange={(e) => this.handleChange(e, 'Account_x0020_Code')}
                        />
                      </div>
                      <div className={'col-md-6'}>
                        <label style={{ display: 'block' }}>Amount:</label>
                        <NumericTextBox value={this.state.item.Amount} required={true} format="c2" min={0} onChange={(e) => this.handleChange(e, 'Amount')} />
                      </div>
                    </div>
                    <div className={'row'} style={{ paddingTop: '5px' }}>
                      <div className={'col-md-6'}>
                        <div className={'col-md-4'}>
                          <label style={{ display: 'block' }}>HST:</label>
                          <Checkbox value={this.state.item.HST_x0020_Taxable} onChange={(e) => this.handleChange(e, 'HST_x0020_Taxable')} />
                        </div>
                        <div className={'col-md-8'}>
                          <label style={{ display: 'block' }}>HST Amount:</label>
                          <NumericTextBox value={this.state.item.HST_x0020_Taxable ? this.state.item.Amount * 0.13 : 0} format="c2" disabled={true} min={0} />
                        </div>
                      </div>
                      <div className={'col-md-6'}>
                        <label style={{ display: 'block' }}>Total:</label>
                        <NumericTextBox value={this.state.item.HST_x0020_Taxable ? (this.state.item.Amount * 0.13) + this.state.item.Amount : this.state.item.Amount} disabled={true} format="c2" min={0} />
                      </div>
                    </div>
                  </div>
                  <div className={'col-md-2'}>
                    <Button primary={true} look={'flat'} disabled={this._disableSaveButton()} title={'Save'} icon={'save'} style={{ marginRight: 5 }} onClick={this.handleSave}></Button>
                    <Button icon={'cancel'} look={'flat'} title={'Cancel'} onClick={this.cancelEdit}></Button>
                  </div>
                </div>
              </CardBody>
              : <CardBody>
                <div className={'row'}>
                  <div className={'col-md-10'}>
                    <div className={'row'}>
                      <div className={'col-md-6'}>
                        <p>
                          {item.Account_x0020_Code}
                        </p>
                      </div>
                      <div className={'col-md-6'}>
                        <div>Amount: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.Amount)}</div>
                        <div>Total: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.Total_x0020_Invoice)}</div>
                      </div>
                    </div>
                  </div>
                  <div className={'col-md-2'}>
                    <Button primary={true} look={'flat'} title={'Edit'} icon={'edit'} style={{ marginRight: 5 }} onClick={this.enterEdit}></Button>
                    <Button icon={'trash'} look={'flat'} title={'Delete'} onClick={this.handleDelete}></Button>
                  </div>
                </div>
              </CardBody>
          }
        </Card>
      </div>
    );
  }
}

export class GLAccountsListView extends React.Component<any, any> {

  constructor(props) {
    super(props);
  }

  public state = {
    value: this.props.value
  };

  public MyCustomItem = props => <GLAccountsListViewItemRender
    {...props}
    saveItem={this.saveAccount}
    deleteItem={(e) => { console.log('deleteItem'); console.log(e); }}
  />;

  public MyHeader = () => {
    return (
      <ListViewHeader style={{ color: 'rgb(160, 160, 160)', fontSize: 14 }} className='pl-3 pb-2 pt-2'>
        <Button primary={true} icon={'plus'} onClick={(e) => {
          this.setState({
            value: [...this.state.value, { edit: true }]
          });
        }}>Add New Account</Button>
      </ListViewHeader>
    );
  }

  public saveAccount = (e, callBack) => {
    console.log('saveAccount');
    console.log(e);
    console.log(this.state.value);

    // Check if GL Code is present. 
    if (!e.Account_x0020_Code) {
      return;
    }

    if (e.Account_x0020_Code.length !== 21) {
      return;
    }

    // Save account to invoice. 
    if (e.ID) {
      this._updateAccount(e, callBack);
    }
    else {
      this._createNewAccount(e, callBack);
    }

    // Update parent grid state.
  }

  private _updateAccount = (e, callBack) => {

  }

  private _createNewAccount = (e, callBack) => {
    delete e.edit;
    e['AR_x0020_Invoice_x0020_RequestId'] = this.props.productInEdit.ID;
    sp.web.lists.getByTitle(MyLists["AR Invoice Accounts"])
      .items.add(e).then(response => {
        response.item.get().then(item => {
          callBack(item);
          this._sentUpdatedAccountsToParent(item);
        });
      });
  }

  /**
   * Add or splice the updated Account into this.state.value
   * this is where all the accounts are stored for the ListView. 
   * 
   * Once we have a complete list of all the accounts, send that 
   * list to the parent of this component. 
   * 
   * The parent will update it's account list.
   */
  private _sentUpdatedAccountsToParent = (updatedAccount) => {
    let allAccounts = this.state.value;

    // Remove place holders
    allAccounts = allAccounts.filter(f => {
      return f.Id !== undefined;
    });

    // If this is a new account there won't be an index found. 
    debugger;
    let indexOfAccount = allAccounts.indexOf(f => f.Id === updatedAccount.Id);
    debugger;

    if (indexOfAccount === -1) {
      // Add a new account.
      allAccounts.push(updatedAccount);
    }
    else {
      // Insert into an existing account. 
      allAccounts[indexOfAccount] = { ...updatedAccount };
    }

    this.props.updateAccountDetails(allAccounts);
  }

  /**
   * render
   */
  public render() {
    return (
      <ListView
        data={this.state.value}
        item={this.MyCustomItem}
        style={{ width: "100%" }}
        header={this.MyHeader}
      />
    );
  }
}

export const MyFinanceGlAccountsComponent = (fieldArrayRenderProps) => {
  const { accounts } = fieldArrayRenderProps;
  const onAdd = () => {
    fieldArrayRenderProps.value.unshift({
      GLCode: '',
      Amount: '',
      HSTTaxable: false,
      inEdit: true
    });
  };

  return (
    <div key={fieldArrayRenderProps.value}>
      <MyFinanceGlAccounts {...fieldArrayRenderProps} onAdd={onAdd} />
    </div>
  );
};

export const GLAccountsListViewComponent = (fieldArrayRenderProps) => {
  return (
    <div key={fieldArrayRenderProps.value}>
      <GLAccountsListView {...fieldArrayRenderProps} />
    </div>
  );
};
