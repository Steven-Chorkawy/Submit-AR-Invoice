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
import { BuildGUID } from './MyHelperMethods';


//#region  Cell Functions




class GLAccountsListViewItemRender extends React.Component<any, any> {
  public state = {
    item: this.props.dataItem
  };
  public componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.dataItem.ID !== this.props.dataItem.ID) {
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

  private _calculateHSTAmount = (e) => {
    debugger;
    return (e.item.HST_x0020_Taxable === true) ? e.item.Amount * 0.13 : 0;
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
                      <div className={'col-md-6 col-sm-6'}>
                        <div className={'col-md-4 col-sm-3'}>
                          <label style={{ display: 'block' }}>HST:</label>
                          <Checkbox value={this.state.item.HST_x0020_Taxable} onChange={(e) => this.handleChange(e, 'HST_x0020_Taxable')} />
                        </div>
                        <div className={'col-md-8 col-sm-3'}>
                          <label style={{ display: 'block' }}>HST Amount:</label>
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(this.state.item.Amount ? this._calculateHSTAmount(this.state) : 0)}
                        </div>
                      </div>
                      <div className={'col-md-6 col-sm-6'}>
                        <label style={{ display: 'block' }}>Total:</label>
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(this.state.item.Amount ? this._calculateHSTAmount(this.state) + this.state.item.Amount : 0)}
                      </div>
                    </div>
                  </div>
                  <div className={'col-md-2'}>
                    <Button primary={true} look={'flat'} disabled={this._disableSaveButton()} title={'Save'} icon={'save'} style={{ marginRight: 5 }} onClick={this.handleSave}></Button>
                    {
                      this.state.item.ID
                        ?
                        <Button icon={'cancel'} look={'flat'} title={'Cancel'} onClick={this.cancelEdit}></Button>
                        :
                        <Button icon={'delete'} look={'flat'} title={'Delete'} onClick={this.handleDelete}></Button>
                    }

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
                        <div style={{ display: "flex" }}>
                          <div style={{ width: '50%' }}>Amount:</div>
                          <div style={{ width: '50%' }}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.Amount)}</div>
                        </div>
                        <div style={{ display: "flex" }}>
                          <div style={{ width: '50%' }}>HST:</div>
                          <div style={{ width: '50%' }}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.HST)}</div>
                        </div>
                        <div style={{ display: "flex" }}>
                          <div style={{ width: '50%' }}>Total:</div>
                          <div style={{ width: '50%' }}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.Total_x0020_Invoice)}</div>
                        </div>
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
    deleteItem={this.deleteAccount}
  />

  public MyHeader = () => {
    return (
      <ListViewHeader style={{ color: 'rgb(160, 160, 160)', fontSize: 14 }} className='pl-3 pb-2 pt-2'>
        <Button primary={true} icon={'plus'} onClick={(e) =>
          this.setState({
            value: [...this.state.value, { edit: true, newAccountGuid: BuildGUID() }]
          })
        }>Add New Account</Button>
      </ListViewHeader>
    );
  }

  public saveAccount = (e, callBack) => {
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
  }

  public deleteAccount = (e) => {
    let values = this.state.value;

    if (e.ID) {
      values = values.filter(f => f.ID !== e.ID);
      sp.web.lists.getByTitle(MyLists["AR Invoice Accounts"])
        .items.getById(e.ID).delete()
        .then(response => {
          this.setState({
            value: [...values]
          });
          this.props.updateAccountDetails(this.state.value);
        });
    }
    else {
      // Records that have not been saved yet.
      values = values.filter(f => f.newAccountGuid !== e.newAccountGuid);
      this.setState({
        value: [...values]
      });
    }
  }

  private _updateAccount = (e, callBack) => {
    console.log('_updateAccount');
    console.log(e);
    delete e.edit;
    delete e.newAccountGuid; // if any

    sp.web.lists.getByTitle(MyLists["AR Invoice Accounts"])
      .items.getById(e.ID)
      .update(e)
      .then(response => {
        response.item.get()
          .then(item => {
            callBack(item);
            this._sentUpdatedAccountsToParent(item);
          });
      });
  }

  private _createNewAccount = (e, callBack) => {
    delete e.edit;
    delete e.newAccountGuid;
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
    let indexOfAccount = allAccounts.findIndex(f => f.Id === updatedAccount.Id);
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

  public render() {
    return (
      <ListView
        data={this.state.value}
        item={this.MyCustomItem}
        style={{ width: "100%", maxWidth: '800px', minHeight: '150px' }}
        header={this.MyHeader}
      />
    );
  }
}

export const GLAccountsListViewComponent = (fieldArrayRenderProps) => {
  return (
    <div key={fieldArrayRenderProps.value}>
      <GLAccountsListView {...fieldArrayRenderProps} />
    </div>
  );
};
