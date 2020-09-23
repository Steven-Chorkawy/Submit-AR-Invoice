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
import { ConvertQueryParamsToKendoFilter, BuildGUID, CreateInvoiceAction, UpdateAccountDetails } from '../MyHelperMethods';
import { InvoiceGridDetailComponent } from '../InvoiceGridDetailComponent';
import { MyLists } from '../enums/MyLists';
import { InvoiceEditForm, IGPAttachmentProps } from './InvoiceEditForm';
import { FileRefCell } from '../FileRefCell';
import { IMySaveResult } from '../interface/IMySaveResult';
import { InvoiceActionRequiredRequestType } from '../interface/IInvoiceActionRequired';
import { QuickFilterButtonGroup } from '../QuickFilterButtonGroup';


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

  // If Finance needs to send a note.
  noteForDepartment?: string;
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
  /**
   * Filter Invoices by a single click of a button.
   * @param e Button click event
   * @param showTheseInvoices The invoices that we want to display
   */
  public onFilterButtonClick = (e, showTheseInvoices) => {
    this.setState({
      invoices: {
        data: showTheseInvoices,
        total: showTheseInvoices.length
      }
    });
  }

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

  //#region Update Methods
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

  // TODO: Test this method.
  private _uploadInvoiceDocument = async (data) => {
    const invoices = this.state.invoices.data;

    // Check to see if there is a file that we can update.
    // If a files is present that means we need to convert the 'Invoice Request' into an 'Invoice'.
    // This means taking all the metadata from the request and applying it to this file.
    if (data.InvoiceAttachments) {
      for (let invoiceAttachmentIndex = 0; invoiceAttachmentIndex < data.InvoiceAttachments.length; invoiceAttachmentIndex++) {
        const element = data.InvoiceAttachments[invoiceAttachmentIndex];
        // TODO: Make this string configurable in the web apps settings.
        // ! Do this before we go live.
        await sp.web.getFolderByServerRelativeUrl('/sites/FinanceTest/ARTest/AR%20Invoices/').files
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

                // I don't know why these two fields are different but they are....
                copiedMetadata['RequiresAccountingClerkTwoApprovalId'] = data['RequiresAccountingClerkTwoApprovId'];

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
                  'Actions',
                  'RequiresAccountingClerkTwoApprovStringId',
                  'RequiresAccountingClerkTwoApprovId',
                  'Accountant_x0020_ApprovalStringId'
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
                    // ? This step right here should be applying the metadata... but its nots?
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

                        const indexOf = invoices.findIndex(fInvoice => fInvoice.ID === editItemId);

                        invoices[indexOf].Id = itemProxy.ID;
                        invoices[indexOf].ID = itemProxy.ID;
                        this.setState({
                          invoices: {
                            data: invoices,
                            total: invoices.length
                          },
                          productInEdit: null
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
              })
              .catch(e => {

                this.setState({
                  gpAttachmentProps: {
                    type: 'error',
                    errorMessage: 'Cannot Save GP Invoice'
                  }
                });
                throw e;
              });
          });
      }
    }
  }

  private _uploadInvoiceDocument2 = async (data) => {
    const invoices = this.state.invoices.data;
    // Check to see if there is a file that we can update.
    // If a files is present that means we need to convert the 'Invoice Request' into an 'Invoice'.
    // This means taking all the metadata from the request and applying it to this file.
    if (data.InvoiceAttachments) {
      for (let invoiceAttachmentIndex = 0; invoiceAttachmentIndex < data.InvoiceAttachments.length; invoiceAttachmentIndex++) {
        const element = data.InvoiceAttachments[invoiceAttachmentIndex];
        // TODO: Make this string configurable in the web apps settings.
        // ! Do this before we go live.
        let fileUploadResult = await sp.web.getFolderByServerRelativeUrl('/sites/FinanceTest/ARTest/AR%20Invoices/').files
          .add(element.name, element.getRawFile(), true);

        let fileUploadItem = await fileUploadResult.file.getItem();
        const itemProxy: any = Object.assign({}, fileUploadItem);

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

        // I don't know why these two fields are different but they are....
        copiedMetadata['RequiresAccountingClerkTwoApprovalId'] = data['RequiresAccountingClerkTwoApprovId'];

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
          'Actions',
          'RequiresAccountingClerkTwoApprovStringId',
          'RequiresAccountingClerkTwoApprovId',
          'Accountant_x0020_ApprovalStringId'
        ]);

        // Adding these fields to copiedMetadata because they aren't coming through in the submitted object.
        copiedMetadata['Requires_x0020_Authorization_x0020_ById'] = {
          results: this.state.productInEdit.Requires_x0020_Department_x0020_Id
        };

        copiedMetadata['AccountDetailsId'] = {
          results: this.state.productInEdit.AccountDetailsId
        };

        let fileUpdateResult = await sp.web.lists.getByTitle(MyLists["AR Invoices"]).items.getById(itemProxy.ID)
          .update({
            StrTitle: element.name,
            Title: element.name,
            // ? This step right here should be applying the metadata... but its nots?
            ...copiedMetadata
          });

        // Update all related records.
        // this update will add the documents id to the files.
        // this will allow us to get all related data for this document without having to use the request record.
        await this._updateRelatedDocuments(editItemId, itemProxy.ID);
        await this._updateInvoiceAccounts(editItemId, itemProxy.ID);
        await this._updateInvoiceRequest(editItemId, itemProxy.ID);
        await this._updateCancelRequests(editItemId, itemProxy.ID);
        await this._updateApprovalRequests(editItemId, itemProxy.ID);

        const indexOf = invoices.findIndex(fInvoice => fInvoice.ID === editItemId);

        invoices[indexOf].Id = itemProxy.ID;
        invoices[indexOf].ID = itemProxy.ID;

        this.setState({
          invoices: {
            data: invoices,
            total: invoices.length
          },
          productInEdit: null
        });
      }
    }
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


  //TODO: Test this method when uploading an attachment to an invoice document.
  /**
   * Upload any new related documents that have been uploaded by a user.
   * @param data Data submitted by the Kendo Form.
   */
  private _uploadRelatedDocuments = async (data) => {
    var relatedDocsOutput = [];

    if (data.RelatedAttachments) {
      for (let relatedInvoiceAttachmentsIndex = 0; relatedInvoiceAttachmentsIndex < data.RelatedAttachments.length; relatedInvoiceAttachmentsIndex++) {
        const element = data.RelatedAttachments[relatedInvoiceAttachmentsIndex];

        // If element has an ID property that means it has already been uploaded.
        if (!element.ID) {

          // TODO: Get this string from the web parts config settings.
          // ? This is throwing an exception when uploading a related attachment to an invoice document.
          let fileUploadResult = await sp.web.getFolderByServerRelativeUrl('/sites/FinanceTest/ARTest/RelatedInvoiceAttachments/').files
            .add(element.name, element.getRawFile(), true);

          const itemProxy: any = Object.assign({}, await fileUploadResult.file.getItem());

          // These are the properties of the related document that we want to update.
          let updateThis = {
            Title: element.name,
            AR_x0020_Invoice_x0020_RequestId:
              data.ContentTypeId === MyContentTypes["AR Request List Item"]
                ? data.ID
                : data.AR_x0020_RequestId,
            ARInvoiceId:
              data.ContentTypeId === MyContentTypes["AR Request List Item"]
                ? null
                : data.ID
          };

          let updateResult = await sp.web.lists.getByTitle(MyLists["Related Invoice Attachments"]).items
            .getById(itemProxy.ID)
            .update(updateThis);

          relatedDocsOutput.push(Object.assign({}, updateResult.item));
        }
      }
    }

    return relatedDocsOutput;
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
   * Update the fields that are present on the form.
   * @param data Data submitted from the Kendo Form.
   */
  private _updateFormFields = async (data) => {

    // These are the fields that can be modified on this form.
    let updateObject = {
      Invoice_x0020_Status: data.Invoice_x0020_Status,
      Invoice_x0020_Number: data.Invoice_x0020_Number,
      Batch_x0020_Number: data.Batch_x0020_Number
    };

    // Update the record.
    // This will either update the request or the invoice record.
    if (data.ContentTypeId === MyContentTypes["AR Request List Item"]) {
      updateObject['Requires_x0020_Accountant_x0020_Id'] = data.Requires_x0020_Accountant_x0020_ ? data.Requires_x0020_Accountant_x0020_.Id : null;

      return await sp.web.lists.getByTitle(MyLists["AR Invoice Requests"])
        .items
        .getById(data.ID)
        .update(updateObject)
        .then(async afterUpdate => {
          // Checks to see if Req Acc Approval exists.
          if (data.Requires_x0020_Accountant_x0020_) {
            // Checks to see if Req Acc Approval is the same that is already present in the state.
            // If the Req Acc Approval ID is the same as the state objects that means we've already sent a task to that accountant.
            // * This is here to prevent an InvoiceAction item from being created each time the invoice is modified.
            if (this.state.productInEdit.Requires_x0020_Accountant_x0020_ === undefined
              || this.state.productInEdit.Requires_x0020_Accountant_x0020_.Id !== data.Requires_x0020_Accountant_x0020_.Id) {
              await CreateInvoiceAction(
                data.Requires_x0020_Accountant_x0020_.Id,
                InvoiceActionRequiredRequestType.AccountantApprovalRequired,
                data.Id
              );
            }
          }



          // Check to see if we need to send an approval request to the department requester.
          // This means that Finance requires more information.
          if (data.Invoice_x0020_Status === InvoiceStatus["Hold for Department"]) {

            await CreateInvoiceAction(
              this.state.productInEdit.Requested_x0020_By.Id,
              InvoiceActionRequiredRequestType.EditRequired,
              data.Id,
              null,
              this.state.noteForDepartment
            );
          }

          // This gets the result of the updated item.
          // After we've updated this item we can start adding extra objects back to it.
          // These extra objects are objects that the forms use but cannot be sent to SP for saving.
          // e.x. The Actions property is not a property that SharePoint uses but it is used to display user requests.
          return await afterUpdate.item.get();
        });
    }
    else {

      updateObject['Requires_x0020_Accountant_x0020_ApprovalId'] = data.Requires_x0020_Accountant_x0020_ ? data.Requires_x0020_Accountant_x0020_.Id : null;
      updateObject['RequiresAccountingClerkTwoApprovalId'] = data.RequiresAccountingClerkTwoApproval ? data.RequiresAccountingClerkTwoApproval.Id : null;

      // No need to create an action for AccountantApproval here because their approval would have already been given.
      var output = await sp.web.lists.getByTitle(MyLists["AR Invoices"]).items
        .getById(data.ID)
        .update(updateObject);

      // Check to see if the RequiresAccountingClerkTwoApprovalId already existed.
      // if it didn't then we need to send an InvoiceAction.
      if (this.state.productInEdit.RequiresAccountingClerkTwoApproval === undefined
        || this.state.productInEdit.RequiresAccountingClerkTwoApproval.Id !== data.RequiresAccountingClerkTwoApproval.Id) {
        await CreateInvoiceAction(
          data.RequiresAccountingClerkTwoApproval.Id,
          InvoiceActionRequiredRequestType.AccountingClerk2ApprovalRequired,
          data.AR_x0020_RequestId,
          data.Id
        );
      }

      return output;
    }
  }

  public onNoteToDepChange = (e) => {
    this.setState({
      noteForDepartment: e.target.value
    });
  }
  //#endregion Update Methods

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
          receivedData: response
        });
        callBack();
      });
  }

  /**
   * Handle the Finance Edit form submit event.
   * @param data JSON Object sent from the Kendo Form.
   */
  public onSubmit2 = async (data) => {

    // Get all the invoices found in the state.  We will use this local variable later.
    const invoices = this.state.invoices.data.slice();

    try {
      // Get the index of the current invoice we're modifying.
      // We will use this later to update the state.
      const index = invoices.findIndex(f => f.ID === data.ID);

      /******************************************************************************
       *
       * Update the various properties and related records of the invoice here.
       *
       * 1. Update any properties that the form can edit.
       * 2. Upload any new related attachments.
       * 3. UPload the GP Attachment document if one is present.
       *
       ******************************************************************************/
      Promise.all([
        this._updateFormFields(data),
        this._uploadRelatedDocuments(data),
        this._uploadInvoiceDocument2(data)
      ])
        .then(response => {
          // TODO: Confirm everything has saved correctly.
          this.setState({ productInEdit: null });
        })
        .catch(e => {
          console.log(e);
          //TODO: Display an error message to the user.

        });

      // TODO: After everything is said and done this is where I can set the productInEdit variable to null, which will close the edit form.
    } catch (error) {
      // Let the user know that something has gone wrong and the upload failed.
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
   * Handle the Finance Edit Form submit.
   * @param data Object of the current item in edit.
   */
  public onSubmit = async (data) => {
    const invoices = this.state.invoices.data.slice();
    console.log('onSubmit');
    console.log(data);

    try {
      const index = invoices.findIndex(p => p.ID === data.ID);
      invoices.splice(index, 1, data);

      // These are the fields that can be modified on this form.
      var updateObject = {
        Invoice_x0020_Status: data.Invoice_x0020_Status,
        Invoice_x0020_Number: data.Invoice_x0020_Number,
        Batch_x0020_Number: data.Batch_x0020_Number,
        Requires_x0020_Accountant_x0020_Id: data.Requires_x0020_Accountant_x0020_ ? data.Requires_x0020_Accountant_x0020_.Id : null,
        RequiresAccountingClerkTwoApprovId: data.RequiresAccountingClerkTwoApprov ? data.RequiresAccountingClerkTwoApprov.Id : null
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

            // Check if we need to create an AccountingClerk2Approval.
            // Only create a new action here if this is a new Clerk given.
            if (data.RequiresAccountingClerkTwoApprovId === null && data.RequiresAccountingClerkTwoApprov) {
              if (this.state.productInEdit.RequiresAccountingClerkTwoApprovId !== data.RequiresAccountingClerkTwoApprov.Id) {
                // If the existing accounting clerk has been replaced we will need to delete the record.
                // TODO: Remove the old accounting clerks actions ONLY if they're still on a waiting status.
              }
              await CreateInvoiceAction(
                data.RequiresAccountingClerkTwoApprov.Id,
                InvoiceActionRequiredRequestType.AccountingClerk2ApprovalRequired,
                data.Id
              );
            }

            // Checks to see if Req Acc Approval exists.
            if (data.Requires_x0020_Accountant_x0020_) {
              // Checks to see if Req Acc Approval is the same that is already present in the state.
              // If the Req Acc Approval ID is the same as the state objects that means we've already sent a task to that accountant.
              // * This is here to prevent an InvoiceAction item from being created each time the invoice is modified.
              if (this.state.productInEdit.Requires_x0020_Accountant_x0020_ === undefined
                || this.state.productInEdit.Requires_x0020_Accountant_x0020_.Id !== data.Requires_x0020_Accountant_x0020_.Id) {
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
          .update(updateObject).then(async afterUpdate => {
            // Check if we need to create an AccountingClerk2Approval.
            // Only create a new action here if this is a new Clerk given.
            if (data.RequiresAccountingClerkTwoApprovId === null && data.RequiresAccountingClerkTwoApprov) {
              if (this.state.productInEdit.RequiresAccountingClerkTwoApprovId !== data.RequiresAccountingClerkTwoApprov.Id) {
                // If the existing accounting clerk has been replaced we will need to delete the record.
                // TODO: Remove the old accounting clerks actions ONLY if they're still on a waiting status.
              }

              await CreateInvoiceAction(
                data.RequiresAccountingClerkTwoApprov.Id,
                InvoiceActionRequiredRequestType.AccountingClerk2ApprovalRequired,
                data.AR_x0020_RequestId,
                data.Id
              );
            }
          });
      }

      // ! September 08, 2020.
      // ! This is failing!  Figure out why this isn't running properly.
      // ! This is preventing me from converting an AR Request into an AR Invoice.
      // Check to see if there is a file that we can update.
      // If a files is present that means we need to convert the 'Invoice Request' into an 'Invoice'.
      // This means taking all the metadata from the request and applying it to this file.
      if (data.InvoiceAttachments) {
        // TODO: Remove this for loop.  It was only here because I was allowing multiple files to be uploaded at one point.  Now we only allow one file.
        for (let invoiceAttachmentIndex = 0; invoiceAttachmentIndex < data.InvoiceAttachments.length; invoiceAttachmentIndex++) {
          const element = data.InvoiceAttachments[invoiceAttachmentIndex];
          // TODO: Make this string configurable in the web apps settings.
          // ! Do this before we go live.
          await sp.web.getFolderByServerRelativeUrl('/sites/FinanceTest/ARTest/AR%20Invoices/').files
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

                  // I don't know why these two fields are different but they are....
                  copiedMetadata['RequiresAccountingClerkTwoApprovalId'] = data['RequiresAccountingClerkTwoApprovId'];

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
                    'Actions',
                    'RequiresAccountingClerkTwoApprovStringId',
                    'RequiresAccountingClerkTwoApprovId',
                    'Accountant_x0020_ApprovalStringId'
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
                      // ? This step right here should be applying the metadata... but its nots?
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
                })
                .catch(e => {

                  this.setState({
                    gpAttachmentProps: {
                      type: 'error',
                      errorMessage: 'Cannot Save GP Invoice'
                    }
                  });
                  throw e;
                });
            });
        }
      }

      // Upload Any related attachments
      if (data.RelatedInvoiceAttachments) {
        for (let relatedInvoiceAttachmentsIndex = 0; relatedInvoiceAttachmentsIndex < data.RelatedInvoiceAttachments.length; relatedInvoiceAttachmentsIndex++) {
          const element = data.RelatedInvoiceAttachments[relatedInvoiceAttachmentsIndex];
          // TODO: Get this string from the web parts config settings.
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

  public updateAccountDetails = (item) => {
    UpdateAccountDetails(
      this.state.invoices,
      item,
      (e) => {
        this.setState({
          invoices: {
            data: e,
            total: e.length
          },
          productInEdit: e[e.findIndex(p => p.ID === this.state.productInEdit.ID)]
        });
      }
    );

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
            {this.state.filter && this.state.filter.filters.length > 0 && (
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

            <QuickFilterButtonGroup invoices={this.state.receivedData.data} onButtonClick={this.onFilterButtonClick} />

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
            // onSubmit={this.onSubmit}
            onNoteToDepChange={this.onNoteToDepChange}
            onSubmit={this.onSubmit2}
            saveResult={this.state.saveResult}
            cancel={this.cancelEditForm}
            updateAccountDetails={this.updateAccountDetails}
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
