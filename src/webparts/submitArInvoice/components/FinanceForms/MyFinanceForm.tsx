import * as React from 'react';
import * as ReactDom from 'react-dom';

// Kendo Imports
import {
  Grid,
  GridColumn,
  GridToolbar
} from '@progress/kendo-react-grid';
import { Button } from '@progress/kendo-react-buttons';
//PnPjs Imports
import { sp } from "@pnp/sp";
import { Web } from "@pnp/sp/webs";
import "@pnp/sp/webs";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/lists";
import "@pnp/sp/items";

// Custom Imports
import { InvoiceDataProvider, QueryInvoiceData } from '../InvoiceDataProvider';
import { MyCommandCell } from './MyCommandCell';
import { filterBy } from '@progress/kendo-data-query';
import { InvoiceStatus, MyGridStrings, MyContentTypes } from '../enums/MyEnums';
import { ConvertQueryParamsToKendoFilter, BuildGUID, CreateInvoiceAction } from '../MyHelperMethods';
import { InvoiceGridDetailComponent } from '../InvoiceGridDetailComponent';
import { MyLists } from '../enums/MyLists';
import { InvoiceEditForm, IGPAttachmentProps } from './InvoiceEditForm';
import { FileRefCell } from '../FileRefCell';
import { IMySaveResult } from '../interface/IMySaveResult';
import { InvoiceActionRequiredRequestType } from '../interface/IInvoiceActionRequired';


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
  currentUser?: any;
  saveResult: IMySaveResult;
  gpAttachmentProps: IGPAttachmentProps;
}

interface IInvoicesDataState {
  //TODO: Change Array<any> to Array<IInvoice>
  data: Array<any>;
  total: number;
}

class CustomUrgentCell extends React.Component<any, any> {
  public render() {
    const value = this.props.dataItem[this.props.field];
    return typeof value === "boolean" && (
      <td>
        {value ? `Yes` : `No`}
      </td>
    );
  }
}

class MyFinanceForm extends React.Component<any, IMyFinanceFormState> {
  constructor(props) {
    super(props);

    let defaultFilters = ConvertQueryParamsToKendoFilter([{ FilterField: 'FILTERFIELD1', FilterValue: 'FILTERVALUE1' }]);

    this.state = {
      invoices: { data: [], total: 0 },
      // Same as invoices but this object is used to restore data to it's original state.
      receivedData: { data: [], total: 0 },
      dataState: {
        take: 20,
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
        filters: defaultFilters
      },
      allRowsExpanded: false,
      gpAttachmentProps: {
        type: null,
        errorMessage: null
      },
      saveResult: {
        success: true,
        message: null
      }
    };

    this.CommandCell = MyCommandCell({
      edit: this.edit,
      remove: null,
      add: null,
      discard: null,
      update: null,
      cancel: this.cancel,
      editField: this._editField
    });
  }

  //#region Variables
  private _editField: string = "inEdit";
  private _columnWidth: string = "150px";
  private _NoSubmittedInvoiceFilter = {
    logic: "and",
    filters: [
      {
        field: "Invoice_x0020_Status",
        operator: "neq",
        value: InvoiceStatus.Submitted
      }
    ]
  };
  //#endregion

  //#region Custom Components

  //this.CommandCell is set in this classes constructor.
  private CommandCell;
  private MyCustomUrgentCell = (props) => <CustomUrgentCell {...props} />;

  public MyCustomCell = (props) => <FileRefCell {...props} />;
  //#endregion

  //#region Methods
  public dataReceived = (invoices) => {
    var dataHolder: any = filterBy(invoices.data, this.state.filter);

    this.setState({
      ...this.state,
      invoices: {
        data: dataHolder,
        total: invoices.total
      },
      receivedData: invoices
    });
  }

  public arDataReceived = (invoices) => {
    var dataHolder: any = filterBy(invoices.data, this.state.filter);

    this.setState({
      ...this.state,
      invoices: {
        data: dataHolder,
        total: invoices.total
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

  public currentUserDataReceived = (user) => {
    this.setState({
      ...this.state,
      currentUser: user
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

  public onFilterChange = (e) => {
    var newData = filterBy(this.state.receivedData.data, e.filter);
    newData.map(invoice => invoice.expanded = this.state.allRowsExpanded);
    var newStateData = {
      data: newData,
      total: newData.length
    };

    this.setState({
      filter: e.filter,
      invoices: newStateData
    });
  }
  //#endregion End Methods

  //#region CRUD Methods
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
   * Open the edit form.
   * @param dataItem Invoice to edit.
   */
  public edit = (dataItem) => {
    console.log('editing');
    console.log(dataItem);
    this.setState({ productInEdit: Object.assign({}, dataItem) });
  }

  /**
   * Take an updated invoice and insert it into the invoice state object.
   *
   * @param updatedItem Invoice that has been submitted
   */
  private _updateInvoiceState = async (callBack: Function) => {
    QueryInvoiceData(
      {
        filterState: this._NoSubmittedInvoiceFilter,
        dataState: this.state.dataState
      },
      response => {
        this.setState({
          invoices: response,
          receivedData: response.data
        });
        callBack();
      });
  }

  // TODO: Update complete this method.
  /**
   * Create an action for accountant approval.
   *
   * @param requiresAccountantApproval
   */
  private _createAccountantApproval = (requiresAccountantApproval) => {

  }

  /**
   * Handle the Finance Edit Form submit.
   * @param data Object of the current item in edit.
   */
  public onSubmit = async (data) => {
    const invoices = this.state.invoices.data.slice();

    try {
      const index = invoices.findIndex(p => p.ID === data.ID);
      invoices.splice(index, 1, data);

      // These are the fields that can be modified on this form.
      var updateObject = {
        Invoice_x0020_Status: data.Invoice_x0020_Status,
        Invoice_x0020_Number: data.Invoice_x0020_Number,
        Batch_x0020_Number: data.Batch_x0020_Number,
        Requires_x0020_Accountant_x0020_Id: data.Requires_x0020_Accountant_x0020_ ? data.Requires_x0020_Accountant_x0020_.Id : null
      };

      // Update the record.
      // This will either update the request or the invoice record.
      if (data.ContentTypeId === MyContentTypes["AR Request List Item"]) {
        await sp.web.lists.getByTitle(MyLists["AR Invoice Requests"]).items
          .getById(data.ID)
          .update(updateObject)
          .then(async afterUpdate => {
            // This gets the result of the updated item.
            // After we've updated this item we can start adding extra objects back to it.
            // These extra objects are objects that the forms use but cannot be sent to SP for saving.
            // e.x. The Actions property is not a property that SharePoint uses but it is used to display user requests.
            await afterUpdate.item.get();

            // Checks to see if Req Acc Approval exists.
            if (data.Requires_x0020_Accountant_x0020_) {
              // Checks to see if Req Acc Approval is the same that is already present in the state.
              // If the Req Acc Approval ID is the same as the state objects that means we've already sent a task to that accountant.
              // * This is here to prevent an InvoiceAction item from being created each time the invoice is modified.
              if (this.state.productInEdit.Requires_x0020_Accountant_x0020_.Id !== data.Requires_x0020_Accountant_x0020_.Id) {
                await CreateInvoiceAction(
                  data.Requires_x0020_Accountant_x0020_.Id,
                  InvoiceActionRequiredRequestType.AccountantApprovalRequired,
                  data.Id
                );
              }
            }
          });
      }
      else {
        // No need to create an action for AccountantApproval here because their approval would have already been given.
        sp.web.lists.getByTitle(MyLists["AR Invoices"]).items
          .getById(data.ID)
          .update(updateObject);
      }

      // Check to see if there is a file that we can update.
      // If a files is present that means we need to convert the 'Invoice Request' into an 'Invoice'.
      // This means taking all the metadata from the request and applying it to this file.
      if (data.InvoiceAttachments) {
        for (let index = 0; index < data.InvoiceAttachments.length; index++) {
          const element = data.InvoiceAttachments[index];
          sp.web.getFolderByServerRelativeUrl('/sites/FinanceTest/ARTest/AR%20Invoices/').files
            .add(element.name, element.getRawFile(), true)
            .then(f => {
              f.file.getItem()
                .then(item => {
                  const itemProxy: any = Object.assign({}, item);
                  const editItemId: number = data.ID;
                  // ! Transfer metadata from AR Request to AR Invoice.
                  // ! THIS IS A HUGE STEP!
                  var copiedMetadata = data;

                  // Add extra fields.
                  copiedMetadata['AR_x0020_RequestId'] = editItemId;
                  copiedMetadata['Requires_x0020_Accountant_x0020_ApprovalId'] = data.Requires_x0020_Accountant_x0020_Id;
                  copiedMetadata['RelatedAttachmentsId'] = {
                    results: data.RelatedAttachmentsId
                  };

                  // TODO: Maps 'Requires_x0020_Department_x0020_' from request to 'Requires_x0020_Authorization_x0020_By' in the invoice.
                  // Remove unwanted fields
                  // These fields should either not be updated here, or they cause SharePoint to throw errors at us.
                  this.removeFields(copiedMetadata, [
                    'ContentTypeId',
                    'FileSystemObjectType',
                    'ServerRedirectedEmbedUri',
                    'ServerRedirectedEmbedUrl',
                    'ComplianceAssetId',
                    'Title',
                    'Requires_x0020_Accountant_x0020_Id',
                    'Requires_x0020_Accountant_x0020_StringId',
                    'Requires_x0020_Authorization_x0020_ByStringId',
                    'Requires_x0020_Accountant_x0020_ApprovalId',
                    'Requires_x0020_Accountant_x0020_ApprovalStringId',
                    'Requires_x0020_Completed_x0020_AId',
                    'Requires_x0020_Completed_x0020_AStringId',
                    'CancelRequests',
                    'RelatedAttachments',
                    'Approvals',
                    'AccountDetails',
                    'AccountDetailsId',
                    'InvoiceAttachments',
                    'ID',
                    'Id',
                    'Attachments',
                    'AR_x0020_InvoiceId',
                    'Requires_x0020_Department_x0020_',
                    'Requires_x0020_Department_x0020_StringId',
                    'Completed_x0020_ApprovalId',
                    'Completed_x0020_ApprovalStringId',
                    'Requires_x0020_Department_x0020_Id',
                    'EditorId',
                    'Created',
                    'AuthorId',
                    'Actions'
                  ]);

                  // Adding these fields to copiedMetadata because they aren't coming through in the submitted object.
                  copiedMetadata['Requires_x0020_Authorization_x0020_ById'] = {
                    results: this.state.productInEdit.Requires_x0020_Department_x0020_Id
                  };
                  copiedMetadata['AccountDetailsId'] = {
                    results: this.state.productInEdit.AccountDetailsId
                  };

                  // Copy the meta data from the AR Req to the AR Invoice.
                  sp.web.lists.getByTitle(MyLists["AR Invoices"]).items.getById(itemProxy.ID)
                    .update({
                      StrTitle: element.name,
                      Title: element.name,
                      ...copiedMetadata
                    })
                    .then(arInvUpdateRes => {
                      // Update all related records.
                      // this update will add the documents id to the files.
                      // this will allow us to get all related data for this document without having to use the request record.
                      Promise.all([
                        this._updateRelatedDocuments(editItemId, itemProxy.ID),
                        this._updateInvoiceAccounts(editItemId, itemProxy.ID),
                        this._updateInvoiceRequest(editItemId, itemProxy.ID),
                        this._updateCancelRequests(editItemId, itemProxy.ID),
                        this._updateApprovalRequests(editItemId, itemProxy.ID)
                      ])
                        .then(value => {
                          const indexOf = invoices.findIndex(fInvoice => fInvoice.AR_x0020_RequestId === editItemId);
                          invoices[indexOf].Id = itemProxy.ID;
                          invoices[indexOf].ID = itemProxy.ID;
                          this.setState({
                            invoices: {
                              data: invoices,
                              total: invoices.length
                            },
                            productInEdit: undefined
                          });
                        });
                    })
                    .catch(e => {
                      console.error("Error Mapping AR Invoice!");
                      this.setState({
                        gpAttachmentProps: {
                          type: 'error',
                          errorMessage: 'Cannot Upload GP Invoice'
                        }
                      });
                      throw e;
                    });
                });
            });
        }
      }

      // Upload Any related attachments
      if (data.RelatedInvoiceAttachments) {
        for (let index = 0; index < data.RelatedInvoiceAttachments.length; index++) {
          const element = data.RelatedInvoiceAttachments[index];
          sp.web.getFolderByServerRelativeUrl('/sites/FinanceTest/ARTest/RelatedInvoiceAttachments/').files
            .add(element.name, element.getRawFile(), true)
            .then(fileRes => {
              fileRes.file.getItem()
                .then(item => {
                  const itemProxy: any = Object.assign({}, item);
                  sp.web.lists.getByTitle(MyLists["Related Invoice Attachments"]).items.getById(itemProxy.ID).update({
                    ARInvoiceId: data.ID,
                    Title: element.name
                  });
                });
            });
        }
      }

      // if everything else has ran successfully we can close this edit form.
      this._updateInvoiceState(e => {
        this.setState({
          productInEdit: null
        });
      });
    } catch (error) {
      console.log('Throwing the error here');
      this.setState({
        gpAttachmentProps: {
          type: 'error',
          errorMessage: 'Cannot Save GP Invoice'
        }
      });
      throw error;
    }
  }

  /**
   * Remove a Field/ Property of a given object.
   * @param input Object that contains unwanted fields.
   * @param fields Fields/ Properties that need to be removed
   */
  private removeFields(input: Object, fields: Array<any>) {
    for (let index = 0; index < fields.length; index++) {
      delete input[fields[index]];
    }
    return input;
  }

  // Add docId to related documents.
  private _updateRelatedDocuments = async (reqId, docId) => {
    // Get the related attachments that for this request.
    await sp.web.lists
      .getByTitle(MyLists["Related Invoice Attachments"])
      .items
      .filter(`AR_x0020_Invoice_x0020_Request/ID eq ${reqId}`)
      .get()
      .then(async (items: any[]) => {
        if (items.length > 0) {
          // Update the related attachment so it is now related to the AR Invoice.
          await sp.web.lists
            .getByTitle(MyLists["Related Invoice Attachments"])
            .items.getById(items[0].Id)
            .update({ ARInvoiceId: docId });
        }
      });
  }

  // Add docId to related accounts.
  private _updateInvoiceAccounts = async (reqId, docId) => {
    await sp.web.lists
      .getByTitle(MyLists["AR Invoice Accounts"])
      .items
      .filter(`AR_x0020_Invoice_x0020_Request/ID eq ${reqId}`)
      .get()
      .then(async (item: any[]) => {
        if (item.length > 0) {
          await sp.web.lists
            .getByTitle(MyLists["AR Invoice Accounts"])
            .items.getById(item[0].Id)
            .update({ AR_x0020_InvoiceId: docId });
        }
      });
  }

  // Add docId to related invoice request.
  private _updateInvoiceRequest = async (reqId, docId) => {
    await sp.web.lists
      .getByTitle(MyLists["AR Invoice Requests"])
      .items
      .filter(`ID eq ${reqId}`)
      .get()
      .then(async (item: any[]) => {
        if (item.length > 0) {
          await sp.web.lists
            .getByTitle(MyLists["AR Invoice Requests"])
            .items.getById(item[0].Id)
            .update({ AR_x0020_InvoiceId: docId });
        }
      });
  }

  // Add docId to related cancel requests.
  private _updateCancelRequests = async (reqId, docId) => {
    //TODO: Test Cancel requests with this new list.
  }

  // Add docId to related approval requests.
  private _updateApprovalRequests = async (reqId, docId) => {
    //TODO: Test Approval process with new list.
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
      let invoiceIndex = this.state.invoices.data.findIndex(p => p.ID === currentAccount.InvoiceID);

      if (invoiceIndex >= 0) {
        let accountIndex = data[invoiceIndex].AccountDetails.findIndex(p => p.ID === currentAccount.ID);
        if (accountIndex >= 0) {
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
          pageable={{ buttonCount: 4, pageSizes: true }}
          resizable={true}

          {...this.state.dataState}
          {...this.state.invoices}

          onDataStateChange={this.dataStateChange}
          onItemChange={this.itemChange}
          editField={this._editField}
          filter={this.state.filter}
          onFilterChange={this.onFilterChange}

          detail={InvoiceGridDetailComponent}
          expandField="expanded"
          onExpandChange={this.expandChange}

          style={{ minHeight: '520px', maxHeight: '700px' }}
        >
          <GridToolbar>
            <Button title="Expand All Rows"
              className="k-button"
              icon="plus"
              onClick={this.expandAllRows}>Toggle All Rows</Button>
            {this.state.filter.filters.length > 0 && (
              <Button
                title="Clear All Filters"
                className="k-button"
                icon="filter-clear"
                onClick={
                  _ => {
                    this.onFilterChange({ filter: { ...this.state.filter, filters: [] } });
                  }
                }
              >Clear All Filters</Button>
            )}
            {hasEditedItem && (
              <Button
                title="Cancel current changes"
                className="k-button"
                icon="cancel"
                onClick={this.cancelCurrentChanges}
              >Cancel Current Changes</Button>
            )}
          </GridToolbar>
          <GridColumn width="75px" field="FileRef" title="" filterable={false} sortable={false} cell={this.MyCustomCell} />
          <GridColumn field="ID" title="ID" width={this._columnWidth} editable={false} />
          <GridColumn field="Date" title="Date" width={this._columnWidth} filter='date' format={MyGridStrings.DateFilter} />
          <GridColumn field="Department" title="Department" width={this._columnWidth} />
          <GridColumn field="Customer.Customer_x0020_Name" title="Customer" width={this._columnWidth} />
          <GridColumn field="Invoice_x0020_Status" title="Status" width={this._columnWidth} />
          <GridColumn field="Invoice_x0020_Number" title="Invoice #" width={this._columnWidth} />
          <GridColumn field="Batch_x0020_Number" title="Batch #" width={this._columnWidth} />
          <GridColumn field="Urgent" title="Urgent" width={this._columnWidth} cell={this.MyCustomUrgentCell} />

          <GridColumn cell={this.CommandCell} width={"110px"} locked={true} resizable={false} filterable={false} sortable={false} />
        </Grid>

        {
          this.state.productInEdit &&
          <InvoiceEditForm
            currentUser={this.state.currentUser}
            dataItem={this.state.productInEdit}
            statusData={this.state.statusData}
            siteUsersData={this.state.siteUsersData}
            onSubmit={this.onSubmit}
            saveResult={this.state.saveResult}
            cancel={this.cancelEditForm}
            onUpdateAccount={this.updateAccount}
            GPAttachmentWidgetProps={this.state.gpAttachmentProps}
          />
        }

        <InvoiceDataProvider
          dataState={this.state.dataState}
          filterState={this._NoSubmittedInvoiceFilter}

          onDataReceived={this.dataReceived}
          onARRequestDataReceived={this.arDataReceived}
          statusDataState={this.state.statusData}
          onStatusDataReceived={this.statusDataReceived}

          siteUsersDataState={this.state.siteUsersData}
          onSiteUsersDataReceived={this.siteUserDataReceived}

          currentUserDataState={this.state.currentUser}
          onCurrentUserDataReceived={this.currentUserDataReceived}
        />
      </div>
    );
  }
}

export { MyFinanceForm };
