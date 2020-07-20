import * as React from 'react';
import * as ReactDom from 'react-dom';

// Kendo Imports
import {
  Grid,
  GridColumn,
  GridToolbar,
  GridDetailRow
} from '@progress/kendo-react-grid';
import { Button } from '@progress/kendo-react-buttons';
import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs';
import { Input, NumericTextBox } from '@progress/kendo-react-inputs';
import { Form, Field, FormElement, FieldArray } from '@progress/kendo-react-form';

//PnPjs Imports
import { sp } from "@pnp/sp";
import { Web } from "@pnp/sp/webs";
import "@pnp/sp/webs";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/lists";
import "@pnp/sp/items";

// Custom Imports
import { InvoiceDataProvider } from '../InvoiceDataProvider';
import { MyCommandCell } from './MyCommandCell';
import * as MyFormComponents from '../MyFormComponents';
import { filterBy } from '@progress/kendo-data-query';
import { filterGroupByField } from '@progress/kendo-react-grid/dist/npm/columnMenu/GridColumnMenuFilter';
import { MyFinanceGlAccountsComponent, MyFinanceGlAccounts } from '../MyFinanceGLAccounts';
import { ApprovalResponseComponent } from '../ApprovalResponseComponent'
import { InvoiceStatus, MyGridStrings } from '../enums/MyEnums';
import { MyRelatedAttachmentComponent } from '../MyRelatedAttachmentComponent';

interface IMyFinanceFormState {
  invoices: IInvoicesDataState;
  receivedData: IInvoicesDataState;
  dataState: any;
  productInEdit: any;
  statusData: any;
  siteUsersData: any;
  filter: any;
  //sort: any;
  allRowsExpanded: boolean;
}

interface IInvoicesDataState {
  //TODO: Change Array<any> to Array<IInvoice>
  data: Array<any>;
  total: number;
}

class MyFinanceForm extends React.Component<any, IMyFinanceFormState> {
  constructor(props) {
    super(props);

    this.state = {
      invoices: { data: [], total: 0 },
      // Same as invoices but this object is used to restore data to it's original state.
      receivedData: { data: [], total: 0 },
      dataState: {
        take: 50,
        skip: 0,
        sort: [
          { field: 'ID', dir: 'desc' }
        ],
      },
      productInEdit: undefined,
      statusData: [],
      siteUsersData: [],
      filter: {
        logic: "and",
        filters: [
          { field: "Invoice_x0020_Status", operator: "neq", value: InvoiceStatus.Submitted }
        ]
      },
      allRowsExpanded: false,
    }

    this.CommandCell = MyCommandCell({
      edit: this.edit,
      remove: this.remove,

      add: this.add,
      discard: this.discard,

      update: this.update,
      cancel: this.cancel,

      editField: this._editField
    });
  }

  //#region Variables
  private _editField: string = "inEdit";
  private _columnWidth: string = "150px";
  //#endregion

  //#region Custom Components

  //this.CommandCell is set in this classes constructor.
  private CommandCell;
  private MyCustomUrgentCell = (props) => <CustomUrgentCell {...props} />
  //#endregion

  //#region Methods
  public dataReceived = (invoices) => {
    console.log("dataReceived");
    console.log(invoices);
    var dataHolder: any = filterBy(invoices.data, this.state.filter);


    this.setState({
      ...this.state,
      invoices: {
        data: dataHolder,
        total: dataHolder.length
      },
      receivedData: invoices
    });
  }

  public statusDataReceived = (status) => {
    this.setState({
      ...this.state,
      statusData: status
    });
  }

  public siteUserDataReceived = (users) => {
    this.setState({
      ...this.state,
      siteUsersData: users
    });
  }

  public dataStateChange = (e) => {
    this.setState({
      ...this.state,
      dataState: e.data
    });
  }

  public expandChange = (event) => {

    event.dataItem.expanded = !event.dataItem.expanded;

    // myFunction is undefined....
    //event.myFunction = this.itemChange;

    this.forceUpdate();
  }

  public expandAllRows = () => {
    this.setState({
      allRowsExpanded: !this.state.allRowsExpanded
    });
    // loop over this.state.invoices.data
    this.state.invoices.data.map(invoice => {
      invoice.expanded = this.state.allRowsExpanded;
      this.expandChange({ dataItem: invoice });
    });
  }

  public cloneProduct(product) {
    return Object.assign({}, product);
  }

  public onFilterChange = (e) => {
    var newData = filterBy(this.state.receivedData.data, e.filter);
    newData.map(invoice => invoice.expanded = this.state.allRowsExpanded);
    var newStateData = {
      data: newData,
      total: newData.length
    }

    this.setState({
      filter: e.filter,
      invoices: newStateData
    });
  }
  //#endregion End Methods

  //#region CRUD Methods
  public removeItem(data, item) {
    let index = data.findIndex(p => p === item || (item.ID && p.ID === item.ID));
    if (index >= 0) {
      data.splice(index, 1);
    }
  }

  public itemChange = (event) => {
    const data = this.state.invoices.data.map(item =>
      item.ID === event.dataItem.ID ? { ...item, [event.field]: event.value } : item
    );

    this.setState({
      invoices: {
        ...this.state.invoices,
        data: data
      }
    });
  }

  /**
   * Grid Edit button click event.
   * @param dataItem Invoice that will be sent to edit mode.
   */
  public enterEdit = (dataItem) => {
    this.setState({
      invoices: {
        // Set any other properties of state.invoices
        ...this.state.invoices,
        // Update the data property.
        // data property is where the invoice objects are held.
        data: this.state.invoices.data.map(item =>
          item.ID === dataItem.ID ? { ...item, inEdit: true } : item
        )
      }
    });
  }


  /**
   * Edit form edit event.
   * @param dataItem Invoice to edit.
   */
  public edit = (dataItem) => {

    this.setState({ productInEdit: this.cloneProduct(dataItem) });
  }

  /**
   * Add/Save new invoice.
   * @param dataItem New Invoice
   */
  public add = (dataItem) => {
    dataItem.inEdit = undefined;

    // TODO: Call method that adds dataItem to the SP List.

    this.setState({
      invoices: {
        ...this.state.invoices
      }
    });
  }

  /**
   * Inline Update method
   * @param dataItem Invoice
   */
  public update = (dataItem) => {
    const data = [...this.state.invoices.data];
    const updatedItem = { ...dataItem, inEdit: undefined };

    this.updateItem(data, updatedItem);

    this.setState({
      invoices: {
        ...this.state.invoices,
        data: data
      }
    });
  }

  public saveEditForm = () => {
    debugger;
    const dataItem = this.state.productInEdit;
    const invoices = this.state.invoices.data.slice();
    // const isNewProduct = dataItem.ProductID === undefined;
    const isNewProduct = false; // TODO: Add this if we plan on letting users create from this form.

    if (isNewProduct) {
      //products.unshift(this.newProduct(dataItem));
    } else {
      const index = invoices.findIndex(p => p.ID === dataItem.ID);
      invoices.splice(index, 1, dataItem);
    }

    this.setState({
      invoices: {
        data: invoices,
        total: invoices.length
      },
      productInEdit: undefined
    });

    var updateObject = {
      Invoice_x0020_Status: dataItem.Invoice_x0020_Status,
      Invoice_x0020_Number: dataItem.Invoice_x0020_Number,
      Batch_x0020_Number: dataItem.Batch_x0020_Number,
      Requires_x0020_Accountant_x0020_ApprovalId: dataItem.Requires_x0020_Accountant_x0020_ApprovalId ? dataItem.Requires_x0020_Accountant_x0020_ApprovalId.Id : null
    }


    sp.web.lists.getByTitle('AR Invoices').items.getById(dataItem.ID).update(updateObject);

    // Check to see if there is a file that we can update.
    if (dataItem.InvoiceAttachments) {
      for (let index = 0; index < dataItem.InvoiceAttachments.length; index++) {
        const element = dataItem.InvoiceAttachments[index];
        const newFileName = dataItem.Title + element.extension;

        sp.web.getFolderByServerRelativeUrl('/sites/FinanceTest/ARTest/AR%20Invoices/').files
          .add(newFileName, element.getRawFile(), true)
          .then(fileResult => {
            // Title is cleared when file uploads? Don't know why but we need it so yeah.
            sp.web.lists.getByTitle('AR Invoices').items.getById(dataItem.ID).update({ Title: dataItem.Title });
          });
      }
    }

    if (dataItem.RelatedInvoiceAttachments) {
      for (let index = 0; index < dataItem.RelatedInvoiceAttachments.length; index++) {
        const element = dataItem.RelatedInvoiceAttachments[index];
        sp.web.getFolderByServerRelativeUrl('/sites/FinanceTest/ARTest/RelatedInvoiceAttachments/').files
          .add(element.name, element.getRawFile(), true)
          .then(fileRes => {
            fileRes.file.getItem()
              .then(item => {
                debugger;
                const itemProxy: any = Object.assign({}, item);
                sp.web.lists.getByTitle('RelatedInvoiceAttachments').items.getById(itemProxy.ID).update({
                  ARInvoiceId: dataItem.ID,
                  Title: element.name
                });
              });
          });
      }
    }
  }

  public updateItem = (data, item) => {
    let index = data.findIndex(p => p === item || (item.ID && p.ID === item.ID));
    if (index >= 0) {
      data[index] = { ...item };
    }
  }

  /**
   * Cancel and discard all changes made to the current edit.
   * @param dataItem Invoice item that we are no longer editing.
   */
  public cancel = (dataItem) => {
    const originalItem = this.state.receivedData.data.find(p => p.ID === dataItem.ID);
    const data = this.state.invoices.data.map(item => item.ID === originalItem.ID ? originalItem : item);
    this.setState({
      invoices: {
        ...this.state.invoices,
        data: data
      },
      productInEdit: undefined
    });
  }

  public cancelEditForm = () => {
    this.setState({ productInEdit: undefined });
  }

  public discard = (dataItem) => {
    const data = [...this.state.invoices.data];
    this.removeItem(data, dataItem);

    this.setState({
      invoices: {
        ...this.state.invoices,
        data: data
      }
    });
  }

  public remove = (dataItem) => {
    const data = [...this.state.invoices.data];
    this.removeItem(data, dataItem);

    this.setState({
      invoices: {
        ...this.state.invoices,
        data: data
      }
    });
  }

  //TODO: Remove this method.  We should not be allowed to add new items in this form.
  /**
   * Create a new row on the grid.
   * This new row is where we can enter new invoices.
   */
  public addNew = () => {
    throw "Don't let this happen.";
    // const newDataItem = { inEdit: true, Discontinued: false };

    // this.setState({
    //   data: [newDataItem, ...this.state.invoices.data]
    // });
  }

  /**
   * Cancel all changes made.
   */
  public cancelCurrentChanges = () => {
    // reset everything back.
    this.setState({
      invoices: { ...this.state.receivedData }
    });
  }

  public updateAccount = (item) => {

    let data = this.state.invoices.data;

    for (let index = 0; index < item.length; index++) {

      const currentAccount = item[index];
      console.log("updateAccount");
      console.log(currentAccount);

      let invoiceIndex = this.state.invoices.data.findIndex(p => p.ID === currentAccount.InvoiceID);

      if (invoiceIndex >= 0) {
        let accountIndex = data[invoiceIndex].AccountDetails.findIndex(p => p.ID === currentAccount.ID);
        if (accountIndex >= 0) {
          console.log(data[invoiceIndex].AccountDetails[accountIndex]);
          data[invoiceIndex].AccountDetails[accountIndex] = {
            ...data[invoiceIndex].AccountDetails[accountIndex],
            Account_x0020_Code: currentAccount.GLCode,
            Amount: currentAccount.Amount,
            HST_x0020_Taxable: currentAccount.HSTTaxable
          };
        }
      }
    }

    this.setState({
      invoices: {
        data: data,
        total: data.length
      }
    });
    this.forceUpdate();
    this.expandAllRows();
  }
  //#endregion end CRUD Methods

  public render() {
    const hasEditedItem = this.state.invoices.data.some(p => p.inEdit);
    return (
      <div>
        <Grid
          filterable={true}
          sortable={true}
          pageable={true}
          resizable={true}
          {...this.state.dataState}
          {...this.state.invoices}
          onDataStateChange={this.dataStateChange}
          onItemChange={this.itemChange}
          editField={this._editField}
          filter={this.state.filter}
          onFilterChange={this.onFilterChange}

          detail={InvoiceDetailComponent}
          expandField="expanded"
          onExpandChange={this.expandChange}
        >
          <GridToolbar>
            <Button title="Expand All Rows"
              className="k-button"
              icon="plus"
              onClick={this.expandAllRows}>Toggle All Rows</Button>
            {hasEditedItem && (
              <Button
                title="Cancel current changes"
                className="k-button"
                icon="cancel"
                onClick={this.cancelCurrentChanges}
              >Cancel Current Changes</Button>
            )}
          </GridToolbar>

          <GridColumn field="ID" title="ID" width={this._columnWidth} editable={false} />
          <GridColumn field="Date" title="Date" width={this._columnWidth} filter='date' format={MyGridStrings.DateFilter} />
          <GridColumn field="Department" title="Department" width={this._columnWidth} />
          <GridColumn field="Customer.Title" title="Customer" width={this._columnWidth} />
          <GridColumn field="Invoice_x0020_Status" title="Status" width={this._columnWidth} />
          <GridColumn field="Invoice_x0020_Number" title="Invoice #" width={this._columnWidth} />
          <GridColumn field="Batch_x0020_Number" title="Batch #" width={this._columnWidth} />
          <GridColumn field="Urgent" title="Urgent" width={this._columnWidth} cell={this.MyCustomUrgentCell} />

          {/* <GridColumn field="Type_x0020_of_x0020_Request" title="Type" width={this._columnWidth} />
          <GridColumn field="Customer_x0020_PO_x0020_Number" title="Customer PO #" width={this._columnWidth} /> */}

          <GridColumn cell={this.CommandCell} width={"110px"} locked={true} resizable={false} filterable={false} sortable={false} />
        </Grid>

        {
          this.state.productInEdit &&
          <InvoiceEditForm
            dataItem={this.state.productInEdit}
            statusData={this.state.statusData}
            siteUsersData={this.state.siteUsersData}
            save={this.saveEditForm}
            cancel={this.cancelEditForm}
            onUpdateAccount={this.updateAccount}
          />
        }

        <InvoiceDataProvider
          dataState={this.state.dataState}
          onDataReceived={this.dataReceived}

          statusDataState={this.state.statusData}
          onStatusDataReceived={this.statusDataReceived}

          siteUsersDataState={this.state.siteUsersData}
          onSiteUsersDataReceived={this.siteUserDataReceived}
        />
      </div>
    );
  }
}

class CustomUrgentCell extends React.Component<any, any> {
  render() {
    const value = this.props.dataItem[this.props.field];
    return typeof value === "boolean" && (
      <td>
        {value ? `Yes` : `No`}
      </td>
    );
  }
}

class InvoiceDetailComponent extends GridDetailRow {

  private itemChangeEvent

  constructor(props) {

    console.log("this element");
    super(props);
  }


  public render() {
    // return this.props.dataItem.inEdit ?
    //   // Return Edit Mode
    //   (
    //     <div>
    //       <Input value={this.props.dataItem.Standard_x0020_Terms} onChange={(e) => this.itemChangeEvent} />
    //     </div>
    //   ) :
    // Return View Mode
    return (
      <div>
        <h3>G/L Accounts</h3>
        <MyFinanceGlAccounts
          value={this.props.dataItem.AccountDetails}
          showCommandCell={false}
          style={{ 'maxWidth': '1200px' }} />
        <hr />

        <h3>Approval Responses</h3>
        <ApprovalResponseComponent
          approvals={this.props.dataItem.Approvals}
        />

      </div>
    );
  }
}

class InvoiceEditForm extends React.Component<any, any> {
  constructor(props) {
    super(props);
    console.log('InvoiceEditForm');
    console.log(props);
    this.state = {
      productInEdit: this.props.dataItem || null,
      visible: false,
    }
  }

  public handleSubmit(event) {
    event.preventDefault();
  }



  public onDialogInputChange = (event) => {
    let target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = (target.props && target.props.name !== undefined) ? target.props.name : (target.name !== undefined) ? target.name : target.props.id;
    const edited = this.state.productInEdit;
    edited[name] = value;
    this.setState({
      productInEdit: edited
    });
  }

  public render() {
    return (
      <Dialog onClose={this.props.cancel} title={"Edit AR Invoice"} minWidth="200px" width="80%" >
        <Form
          onSubmit={this.handleSubmit}
          render={(formRenderProps) => (
            <FormElement style={{ width: '100%' }}>
              <fieldset className={'k-form-fieldset'}>
                <div style={{ marginBottom: "2px" }}>
                  <Field
                    id={'Invoice_x0020_Status'}
                    name={'Invoice_x0020_Status'}
                    label={'Status'}
                    value={this.state.productInEdit.Invoice_x0020_Status}
                    data={this.props.statusData}
                    onChange={this.onDialogInputChange}
                    component={MyFormComponents.FormDropDownList}
                  />
                </div>
                <div style={{ marginBottom: "2px" }}>
                  <Field
                    id="Requires_x0020_Accountant_x0020_ApprovalId"
                    name="Requires_x0020_Accountant_x0020_ApprovalId"
                    label="Requires Approval From Accountant"
                    data={this.props.siteUsersData}
                    dataItemKey="Id"
                    textField="Title"
                    value={this.state.productInEdit.Requires_x0020_Accountant_x0020_ApprovalId}
                    onChange={this.onDialogInputChange}
                    disabled={this.state.productInEdit.Invoice_x0020_Status !== 'Accountant Approval Required'}
                    component={MyFormComponents.FormComboBox}
                  />
                </div>
                <div style={{ marginBottom: "2px" }}>
                  <Field
                    id={'Invoice_x0020_Number'}
                    name={'Invoice_x0020_Number'}
                    label={'Invoice Number'}
                    value={this.state.productInEdit.Invoice_x0020_Number}
                    onChange={this.onDialogInputChange}
                    component={MyFormComponents.FormInput}
                  />
                </div>
                <div style={{ marginBottom: "2px" }}>
                  <Field
                    id={'Batch_x0020_Number'}
                    name={'Batch_x0020_Number'}
                    label={'Batch Number'}
                    value={this.state.productInEdit.Batch_x0020_Number}
                    onChange={this.onDialogInputChange}
                    component={MyFormComponents.FormInput}
                  />
                </div>
                <div style={{ marginBottom: "2px" }}>
                  <FieldArray
                    name="GLAccounts"
                    component={MyFinanceGlAccountsComponent}
                    value={this.state.productInEdit.AccountDetails}
                    onUpdateAccount={this.props.onUpdateAccount}
                  //onchange={this.onDialogInputChange}
                  />
                </div>
                <div style={{ marginBottom: "2px" }}>
                  <Field
                    id="InvoiceAttachments"
                    name="InvoiceAttachments"
                    label="Upload Attachments"
                    batch={false}
                    multiple={false}
                    myOnChange={this.onDialogInputChange}
                    component={MyFormComponents.FormUpload}
                  />
                </div>
                <div style={{ marginBottom: "2px" }}>
                  <MyRelatedAttachmentComponent
                    productInEdit={this.state.productInEdit}
                    onChange={this.onDialogInputChange}
                  />
                </div>
              </fieldset>
            </FormElement>
          )}
        />
        <DialogActionsBar>
          <Button
            className="k-button k-primary"
            icon="save"
            primary={true}
            onClick={this.props.save}
          >Save</Button>
          <Button
            className="k-button"
            icon="cancel"
            onClick={this.props.cancel}
          >Cancel</Button>
        </DialogActionsBar>
      </Dialog>
    );
  }
}

export { MyFinanceForm }
