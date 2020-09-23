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
import { NumericTextBox, Checkbox } from '@progress/kendo-react-inputs';
import { Grid, GridColumn, GridToolbar } from '@progress/kendo-react-grid';
import { Button } from '@progress/kendo-react-buttons';

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
          validator={MyValidators.glCodeCell}
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
          //validator={MyValidators.accountAmountValidator}
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
  const dataValue = dataItem[field] === null ? '' : dataItem[field];

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
            (props.dataItem.Amount == null) ? 0 : CalculateHSTAmount(props) + props.dataItem.Amount
          }
        />
      ) : (
          <NumericTextBox
            // defaultValue={dataValue}
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
