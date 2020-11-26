import * as React from 'react';
import * as ReactDom from 'react-dom';

// Kendo Imports
import {
  Grid,
  GridColumn as Column,
  GridCell,
  GridToolbar,
} from '@progress/kendo-react-grid';
import { Button, SplitButton, DropDownButton } from '@progress/kendo-react-buttons';


//PnPjs Imports
import { sp } from "@pnp/sp";
import { Web } from "@pnp/sp/webs";
import "@pnp/sp/webs";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/lists";
import "@pnp/sp/items";

// Import my stuff.
import IARInvoice from '../IARInvoice';
import { filterBy, orderBy, groupBy } from '@progress/kendo-data-query';
import { DepartmentGridEditDialogContainer } from './DepartmentGridEditDialogContainer';
import { ApprovalDialogContainer } from '../ApprovalDialogContainer';
import { RequestApprovalDialogComponent } from '../RequestApprovalDialogComponent';
import { MyCancelDialogContainer } from './MyCancelDialogContainer';
import { InvoiceDataProvider } from '../InvoiceDataProvider';
import { InvoiceActionResponseStatus, InvoiceStatus, MyGridStrings } from '../enums/MyEnums';
import { ConvertQueryParamsToKendoFilter, UpdateAccountDetails } from '../MyHelperMethods';
import { InvoiceGridDetailComponent } from '../InvoiceGridDetailComponent';
import { MyLists } from '../enums/MyLists';
import { MyContentTypes } from '../enums/MyEnums';
import { FileRefCell } from '../FileRefCell';
import { IDCell } from '../IDCell';
import { IInvoiceItem, IInvoiceUpdateItem, IMySaveResult } from '../interface/MyInterfaces';
import { QuickFilterButtonGroup } from '../QuickFilterButtonGroup';


type DepartmentGridState = {
  data: any;
  receivedData: Array<IInvoiceItem>;
  filter: any;
  result?: any;
  dataState?: any;
  productInEdit: any;
  productInCancel: any;
  productInApproval: any;
  requestingApprovalFor: any;
  statusData: any;
  siteUsersData: any;
  currentUser?: any;
  saveResult?: IMySaveResult;
};

export class DepartmentGrid extends React.Component<any, DepartmentGridState> {
  constructor(props) {
    super(props);

    var defaultFilters = ConvertQueryParamsToKendoFilter([{ FilterField: 'FILTERFIELD1', FilterValue: 'FILTERVALUE1' }]);

    this.state = {
      data: [],
      receivedData: [],
      statusData: [],
      siteUsersData: [],
      filter: {
        logic: "and",
        filters: defaultFilters
      },
      productInEdit: undefined,
      productInCancel: undefined,
      productInApproval: undefined,
      requestingApprovalFor: undefined,
      dataState: {
        take: 20,
        skip: 0,
        sort: [
          { field: 'ID', dir: 'desc' }
        ],
      }
    };

    sp.web.currentUser.get()
      .then(user => {
        this.setState({
          currentUser: user
        });

        this.CommandCell = MyCommandCell({
          edit: this.onEdit,
          cancel: this.onInvoiceCancel,
          approvalResponse: this.onApprovalResponse,
          requestApproval: this.onRequestApproval,
          currentUser: user
        });
      });
  }

  private CommandCell;

  //#region Methods
  public MyCustomCell = (props) => <FileRefCell {...props} />;

  public dataStateChange = (e) => {
    this.setState({
      ...this.state,
      dataState: e.data
    });
  }

  public expandChange = (event) => {
    event.dataItem[event.target.props.expandField] = event.value;
    this.setState({
      result: Object.assign({}, this.state.result),
      dataState: this.state.dataState
    });
  }
  //#endregion

  //#region Data Operations
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

  public dataReceived = (invoices) => {
    var fData = this._filterMyData(invoices.data, this.state.filter);

    this.setState({
      ...this.state,
      data: {
        data: fData,
        total: fData.length
      },
      receivedData: invoices.data
    });
  }

  public arDataReceived = (invoices) => {
    var fData = this._filterMyData(invoices.data, this.state.filter);

    this.setState({
      ...this.state,
      data: {
        data: fData,
        total: fData.length
      },
      receivedData: invoices.data
    });
  }

  public onFilterChange = (e) => {
    var newData = this._filterMyData(this.state.receivedData, e.filter);

    var newStateData = {
      data: newData,
      total: newData.length
    };

    this.setState({
      filter: e.filter,
      data: newStateData
    });
  }

  private _filterMyData(data, filter) {
    return filterBy(data, filter);
  }

  /**
   * Filter Invoices by a single click of a button.
   * @param e Button click event
   * @param showTheseInvoices The invoices that we want to display
   */
  public onFilterButtonClick = (e, showTheseInvoices) => {
    this.setState({
      data: {
        data: showTheseInvoices,
        total: showTheseInvoices.length
      }
    });
  }
  //#endregion

  //#region CRUD Methods

  public updateAccountDetailsForApproval = (data) => {
    UpdateAccountDetails(
      this.state.data,
      data,
      (e) => {
        this.setState({
          data: {
            data: e,
            total: e.length
          },
          productInApproval: e[e.findIndex(p => p.ID === this.state.productInApproval.ID)]
        });
      });
  }

  public removeRelatedAttachments = (element, invoiceId) => {
    let invoiceIndex = this.state.data.data.findIndex(f => f.Id === invoiceId);
    let dataState = this.state.data.data;
    dataState[invoiceIndex].RelatedAttachments = dataState[invoiceIndex].RelatedAttachments.filter(f => { return f.Id !== element.id; });
  }

  public updateRelatedAttachments = (element, invoiceId) => {
    sp.web.lists.getByTitle('RelatedInvoiceAttachments')
      .items
      .filter(`AR_x0020_Invoice_x0020_Request/ID eq ${invoiceId}`)
      .getAll()
      .then(newestMetadata => {
        sp.web.getFolderByServerRelativePath(MyLists["Related Invoice Attachments"])
          .files()
          .then(docFromSP => {
            let thisNewFile = docFromSP.find(f => f.Title === element.name);
            let thisNewFileMetadata = newestMetadata.find(f => f.Title === element.name);

            thisNewFileMetadata.ServerRedirectedEmbedUrl = thisNewFile.ServerRelativeUrl;

            let invoiceIndex = this.state.data.data.findIndex(f => f.Id === invoiceId);
            let dataState = this.state.data.data;
            dataState[invoiceIndex].RelatedAttachments.push(thisNewFileMetadata);

            this.setState({
              data: {
                data: dataState,
                total: dataState.length
              }
            });
          });
      });
  }

  public onEdit = (dataItem) => {
    this.setState({ productInEdit: Object.assign({}, dataItem) });
  }

  public onInvoiceCancel = (dataItem) => {
    this.setState({
      productInCancel: Object.assign({}, dataItem)
    });
  }

  /**
   * When a user requests an approval for an invoice this will open the dialog. 
   * @param dataItem Invoice that needs an approval.
   */
  public onRequestApproval = (dataItem) => {
    this.setState({
      requestingApprovalFor: Object.assign({}, dataItem)
    });
  }

  /**
   * Save the approval request data from the Panel.
   * @param e Data from form
   */
  public onApprovalRequestSave = (e) => {
    let reqForInvoice = this.state.requestingApprovalFor;
    // Close the dialog. 
    this.setState({
      requestingApprovalFor: undefined
    });

    for (let index = 0; index < e.Users.length; index++) {
      const user = e.Users[index];

      let obj = {
        Title: e.Request_x0020_Type,
        AssignedToId: user.Id,
        AR_x0020_Invoice_x0020_RequestId: reqForInvoice.ID,
        Body: e.Description,
        Response_x0020_Status: InvoiceActionResponseStatus.Waiting,
        Request_x0020_Type: e.Request_x0020_Type
      };

      // TODO: Maybe use CreateInvoiceAction method from the MyHelperMethods file. 
      sp.web.lists.getByTitle(MyLists.InvoiceActionRequired).items.add(obj)
        .then(response => {
          response.item
            .select('*, AssignedTo/EMail, AssignedTo/Title, Author/EMail, Author/Title')
            .expand('AssignedTo, Author')
            .get()
            .then(item => {
              // Update the invoice found in state.data.data 
              let allInvoices = this.state.data.data;
              const indexOfCurrentInvoice = allInvoices.findIndex(f => f.ID === reqForInvoice.Id);
              allInvoices[indexOfCurrentInvoice].Actions = [...allInvoices[indexOfCurrentInvoice].Actions, item];
              this.setState({
                data: {
                  data: allInvoices
                }
              });

              // Update the invoice found in productsInEdit if it is set.
              if (this.state.productInEdit) {
                let prodInEdit = this.state.productInEdit;
                prodInEdit.Actions = [...prodInEdit.Actions, item];
                this.setState({
                  productInEdit: prodInEdit
                });
              }
            });
        });
    }
  }

  /**
   * When a user clicks Approve/Deny.
   * @param dataItem Item user wants to approve.
   */
  public onApprovalResponse = (dataItem) => {
    this.setState({
      productInApproval: Object.assign({}, dataItem)
    });
  }

  /**
   * When a user submits an approval response. 
   * @param dataItem Approval Modified.
   */
  public approvalResponseSent = (approvalItem) => {
    // This is the invoice that we will need to update in state.data.data
    let allInvoices = this.state.data.data;
    const invoiceIndex = allInvoices.findIndex(a => a.ID === this.state.productInApproval.ID);
    let invoice = allInvoices[invoiceIndex];

    // Update the approval action item in the productInApproval state. 
    const approvalActionIndex = invoice.Actions.findIndex(a => a.ID === approvalItem.ID);

    // Store all the approval actions here so we can edit them. 
    let allApprovalActions = invoice.Actions;

    // Update the approval using the index that we previously found. 
    allApprovalActions[approvalActionIndex] = approvalItem;

    invoice.Actions = allApprovalActions;

    allInvoices[invoiceIndex] = { ...invoice };

    this.setState({
      data: {
        data: allInvoices
      },
      productInApproval: undefined
    });
  }

  // Handle custom customer change event.
  public onCustomCustomerChange = (event) => {
    let target = event.target;
    let value = target.type === 'checkbox' ? target.checked : target.value;

    this.setState({
      productInEdit: {
        ...this.state.productInEdit,
        MiscCustomerDetails: value
      }
    });
  }

  /**
   * Save the edit dialog box form.
   * @param event Data Submitted from form.
   */
  public handleSubmit = (event) => {
    let currentEditItem: IInvoiceUpdateItem = {
      Id: event.Id,
      ID: event.ID,
      Department: event.Department,
      Date: event.Date,
      Requested_x0020_ById: event.Requested_x0020_ById,
      Urgent: event.Urgent,
      CustomerId: event.CustomerId,
      Customer_x0020_PO_x0020_Number: event.Customer_x0020_PO_x0020_Number,
      Invoice_x0020_Details: event.Invoice_x0020_Details,
      MiscCustomerName: event.MiscCustomerName,
      MiscCustomerDetails: event.MiscCustomerDetails,
      DirtyField: event.DirtyField,
      Requires_x0020_Department_x0020_Id: {
        results: event.Requires_x0020_Department_x0020_.map(f => f.Id)
      }
    };

    // Check to see if the submitted customer contains an ID field.
    // If it does not that means that we're taking in a Misc Customer and will need to parse out the data.
    if (!event.Customer.hasOwnProperty('ID')) {
      // This means we need to take out the customer name.
      currentEditItem.MiscCustomerName = event.Customer.Customer_x0020_Name;
      currentEditItem.DirtyField = new Date();

      // If a customer was previously selected it's ID will still be present.
      currentEditItem.CustomerId = null;
    }
    else {
      // If a custom ID is present then we will need to update the Customer ID property incase it's been changed.
      if (currentEditItem.CustomerId !== event.Customer.Id) {
        currentEditItem.CustomerId = event.Customer.Id;
      }
    }


    sp.web.lists
      .getByTitle(MyLists["AR Invoice Requests"])
      .items
      .getById(currentEditItem.ID)
      .update(currentEditItem)
      .then(f => {
        // Update the invoices in the state.
        let allInvoices = this.state.data.data;
        const invoiceIndex = allInvoices.findIndex(fInvoice => fInvoice.ID === currentEditItem.ID);
        let oldInvoiceData = allInvoices[invoiceIndex];
        oldInvoiceData = { ...oldInvoiceData, ...currentEditItem };

        allInvoices.splice(invoiceIndex, 1, oldInvoiceData);

        if (event.RelatedAttachments) {
          for (let index = 0; index < event.RelatedAttachments.length; index++) {
            const element = event.RelatedAttachments[index];

            // If the attachment does not have an ID that means it is a new attachment.
            if (!element.hasOwnProperty('Id')) {
              sp.web
                .getFolderByServerRelativeUrl(`${this.props.context.pageContext.web.serverRelativeUrl}/${MyLists["Related Invoice Attachments"]}`)
                .files.add(element.name, element.getRawFile(), true)
                .then(fileRes => {
                  fileRes.file.getItem()
                    .then(item => {
                      const itemProxy: any = Object.assign({}, item);
                      let relatedAttachmentUpdateObject = {
                        Title: element.name,
                        AR_x0020_Invoice_x0020_RequestId: event.Id
                      };

                      if (event.ContentTypeId === MyContentTypes["AR Request List Item"]) {
                        relatedAttachmentUpdateObject['AR_x0020_Invoice_x0020_RequestId'] = event.ID;
                      }
                      else {
                        relatedAttachmentUpdateObject['ARInvoiceId'] = event.ID;
                      }

                      sp.web.lists.getByTitle(MyLists["Related Invoice Attachments"])
                        .items.getById(itemProxy.ID)
                        .update(relatedAttachmentUpdateObject)
                        .then(rAttachmentRes => {
                          let currentRAttachmentIds = event.RelatedAttachments
                            .filter(fromRelatedAttachments => fromRelatedAttachments.hasOwnProperty('Id'))
                            .map(fromRelatedAttachmentsMap => fromRelatedAttachmentsMap.Id);
                          currentRAttachmentIds.push(itemProxy.ID);

                          // Update the request item with this new object.
                          sp.web.lists.getByTitle(MyLists["AR Invoice Requests"])
                            .items.getById(event.Id)
                            .update({
                              RelatedAttachmentsId: {
                                results: currentRAttachmentIds
                              }
                            });
                        });
                    });
                });
            }
          }
        }

        this.setState({
          data: {
            data: allInvoices,
            total: allInvoices.length
          },
          productInEdit: null
        });
      })
      .catch(e => {
        var res = e;
        console.log('Error while updating invoice');
        console.log(e);

        this.setState({
          saveResult: {
            success: false,
            message: "Could not save your changes.  Please contact help desk."
          }
        });
      });
  }

  public save = () => {
    const dataItem = this.state.productInEdit;

    const invoices = this.state.data.data.slice();
    // const isNewProduct = dataItem.ProductID === undefined;
    const isNewProduct = false; // false because we don't let users create new items here.

    if (isNewProduct) {
      //invoices.unshift(this.newProduct(dataItem));
    } else {
      const index = invoices.findIndex(p => p.ID === dataItem.ID);
      invoices.splice(index, 1, dataItem);
    }



    let updateObject = {
      Department: dataItem.Department,
      Date: dataItem.Date,
      Requested_x0020_ById: dataItem.Requested_x0020_ById,
      Urgent: dataItem.Urgent,
      CustomerId: dataItem.CustomerId,
      MiscCustomerName: dataItem.CustomerId === null ? dataItem.Customer.Customer_x0020_Name : null,
      MiscCustomerDetails: dataItem.CustomerId === null ? dataItem.Customer.CustomerDetails : null,
      Comment: dataItem.Comment,
      Invoice_x0020_Details: dataItem.Invoice_x0020_Details,
      Customer_x0020_PO_x0020_Number: dataItem.Customer_x0020_PO_x0020_Number,
      Standard_x0020_Terms: dataItem.Standard_x0020_Terms,
    };


    // Update request item.
    if (dataItem.ContentTypeId === MyContentTypes["AR Request List Item"]) {
      updateObject['Requires_x0020_Department_x0020_Id'] = {
        'results': dataItem.Requires_x0020_Department_x0020_Id.map((user) => {
          if (Number.isInteger(user)) {
            return user;
          }
          else {
            return user.Id;
          }
        })
      };
      sp.web.lists.getByTitle(MyLists["AR Invoice Requests"]).items.getById(dataItem.ID).update(updateObject);
    }
    // Update document item.
    else {
      updateObject['Requires_x0020_Authorization_x0020_ById'] = {
        'results': dataItem.Requires_x0020_Authorization_x0020_ById.map((user) => {
          if (Number.isInteger(user)) {
            return user;
          }
          else {
            return user.Id;
          }
        })
      };
      sp.web.lists.getByTitle(MyLists["AR Invoices"]).items.getById(dataItem.ID).update(updateObject);
    }


    if (dataItem.RelatedAttachments) {

      for (let index = 0; index < dataItem.RelatedAttachments.length; index++) {
        const element = dataItem.RelatedAttachments[index];
        sp.web.getFolderByServerRelativeUrl('/sites/FinanceTest/ARTest/RelatedAttachments/').files
          .add(element.name, element.getRawFile(), true)
          .then(fileRes => {
            fileRes.file.getItem()
              .then(item => {
                const itemProxy: any = Object.assign({}, item);
                let relatedAttachmentUpdateObject = {
                  Title: element.name
                };

                if (dataItem.ContentTypeId === MyContentTypes["AR Request List Item"]) {
                  relatedAttachmentUpdateObject['AR_x0020_Invoice_x0020_RequestId'] = dataItem.ID;
                }
                else {
                  relatedAttachmentUpdateObject['ARInvoiceId'] = dataItem.ID;
                }

                sp.web.lists.getByTitle('RelatedAttachments').items.getById(itemProxy.ID).update(relatedAttachmentUpdateObject);
              });
          });
      }
    }


    // Query the new record to get all the new info.
    //TODO: Include more related records here.
    sp.web.lists.getByTitle(MyLists["AR Invoice Requests"])
      .items.getById(dataItem.ID)
      .get()
      .then(response => {
        const index = invoices.findIndex(p => p.ID === dataItem.ID);
        invoices.splice(index, 1, response);
        this.setState({
          data: {
            data: invoices,
            total: invoices.length
          },
          productInEdit: undefined
        });
      });
  }

  /**
   * TODO: This  method should also create approval requests. 
   * * The approval request should a type of InvoiceActionRequestTypes.CancelRequest.
   */
  /**
   * ! What if I removed the Cancel Request list and only used the Invoice Action list.
   * ! That way to submit a Cancel Request a user could do it the same way they submit an approval. 
   * ! The cancel request would also be approved or denied by the user as well same as an approval request.
   * ! Then the only way we would keep track of if an invoice is cancelled or not would be through it's status
   * ! and it's 'action' requests. 
   */
  public sendCancelRequest = () => {
    sp.web.currentUser.get()
      .then(currentUser => {
        const dataItem = this.state.productInCancel;

        var cancelReqUpdateObj = {
          Title: 'Invoice Cancel Request',
          AR_x0020_Invoice_x0020_RequestId: dataItem.ID,
          Requested_x0020_ById: currentUser.Id,
          Requester_x0020_Comments: dataItem.CancelComment
        };

        sp.web.lists.getByTitle(MyLists["Cancel Invoice Request"])
          .items
          .add(cancelReqUpdateObj)
          .then(createRes => {
            var indexOf = this.state.data.data.findIndex(f => f.ID === dataItem.Id);

            // Update the state objects.
            sp.web.lists.getByTitle(MyLists["Cancel Invoice Request"])
              .items.getById(createRes.data.Id)
              .select('*, Requested_x0020_By/EMail, Requested_x0020_By/Title')
              .expand('Requested_x0020_By')
              .get()
              .then(response => {
                var updatedARs = this.state.data.data;
                updatedARs[indexOf].CancelRequests.push(response);
                this.setState({
                  data: {
                    data: updatedARs,
                    total: updatedARs.length
                  },
                  productInCancel: undefined
                });
              });
          });
      });
  }

  public cancel = () => {
    this.setState({ productInEdit: undefined });
  }
  //#endregion

  public rowRender(trElement, props) {
    const red = { backgroundColor: "rgb(243, 23, 0, 0.32)" };
    const trProps = { style: props.dataItem.CancelRequests.length > 0 && red };

    if (props.dataItem.CancelRequests.length > 0) {
      return React.cloneElement(trElement, { ...trProps }, trElement.props.children);
    }
    else {
      return React.cloneElement(trElement, trElement.props.children);
    }
  }

  public render() {
    return (
      <div>
        <Grid
          filterable={true}
          sortable={true}
          pageable={{ buttonCount: 4, pageSizes: true }}
          resizable={true}

          {...this.state.dataState}
          {...this.state.data}

          onDataStateChange={this.dataStateChange}

          filter={this.state.filter}
          onFilterChange={this.onFilterChange}

          style={{ minHeight: '520px', maxHeight: '700px' }}

          onExpandChange={this.expandChange}
          expandField="expanded"

          detail={InvoiceGridDetailComponent}
          rowRender={this.rowRender}
        >
          <GridToolbar>
            {this.state.filter && this.state.filter.filters.length > 0 && (
              <Button
                title="Clear All Filters"
                className="k-button"
                icon="filter-clear"
                onClick={_ => { this.onFilterChange({ filter: { ...this.state.filter, filters: [] } }); }}
              >Clear All Filters</Button>
            )}
            <QuickFilterButtonGroup
              invoices={this.state.receivedData}
              onButtonClick={this.onFilterButtonClick}
            />
          </GridToolbar>

          {/* <Column width="75px" field="" title="" filterable={false} sortable={false} cell={this.MyCustomCell} /> */}
          <Column field="ID" title="ID" width="75px" filterable={false} cell={(props) => <IDCell {...props} />} />
          <Column field="Created" width="250px" title="Created Date" filter="date" format={MyGridStrings.DateFilter} />
          <Column field="Customer.Customer_x0020_Name" width="250px" title="Customer" />
          <Column field="Invoice_x0020_Status" width="250px" title="Status" />
          <Column field="Date" title="Date" width="250px" filter="date" format={MyGridStrings.DateFilter} />
          {/* <Column field="Type_x0020_of_x0020_Request" width="250px" title="Type" /> */}

          <Column cell={this.CommandCell} width={"120px"} locked={true} resizable={false} filterable={false} sortable={false} />

        </Grid>
        {
          this.state.productInEdit &&
            <DepartmentGridEditDialogContainer
              context={this.props.context}
              dataItem={this.state.productInEdit}
              customers={this.props.customers}
              siteUsers={this.props.siteUsers}
              currentUser={this.state.currentUser}
              saveResult={this.state.saveResult}
              onSubmit={this.handleSubmit}
              onRelatedAttachmentAdd={this.updateRelatedAttachments}
              onRelatedAttachmentRemove={this.removeRelatedAttachments}
              updateAccountDetails={(e) => {
                // e will be a list of all the accounts.              
                let invoiceIndex = this.state.data.data.findIndex(f => f.Id === this.state.productInEdit.ID);
                let dataState = this.state.data.data;
                dataState[invoiceIndex].AccountDetails = [...e];
                this.setState({
                  data: {
                    data: dataState
                  },
                  productInEdit: { ...this.state.productInEdit, AccountDetails: [...e] }
                });
              }}
              onCustomCustomerChange={this.onCustomCustomerChange}
              onAddNewApproval={(e) =>
                this.setState({
                  requestingApprovalFor: this.state.productInEdit
                })
              }
              cancel={this.cancel}
            />
        }
        {
          this.state.productInCancel &&
          <MyCancelDialogContainer
            dataItem={this.state.productInCancel}
            save={this.sendCancelRequest}
            cancel={() => { this.setState({ productInCancel: undefined }); }}
          />
        }
        {
          this.state.productInApproval &&
          <ApprovalDialogContainer
            context={this.props.context}
            dataItem={this.state.productInApproval}
            currentUser={this.state.currentUser}
            updateAccountDetails={(e) => {
              // e will be a list of all the accounts.              
              let invoiceIndex = this.state.data.data.findIndex(f => f.Id === this.state.productInApproval.ID);
              let dataState = this.state.data.data;
              dataState[invoiceIndex].AccountDetails = [...e];
              this.setState({
                data: {
                  data: dataState
                },
                productInApproval: { ...this.state.productInApproval, AccountDetails: [...e] }
              });
            }}
            onResponseSent={this.approvalResponseSent}
            onRelatedAttachmentAdd={this.updateRelatedAttachments}
            onRelatedAttachmentRemove={this.removeRelatedAttachments}
            cancel={() => { this.setState({ productInApproval: undefined }); }}
          />
        }
        {
          this.state.requestingApprovalFor &&
          <RequestApprovalDialogComponent
            context={this.props.context}
            dataItem={this.state.requestingApprovalFor}
            currentUser={this.state.currentUser}
            onSave={this.onApprovalRequestSave}
            onDismiss={(e) =>
              this.setState({
                requestingApprovalFor: undefined
              })
            }
          />
        }
        <InvoiceDataProvider
          dataState={this.state.dataState}
          onDataReceived={this.dataReceived}
          onARRequestDataReceived={this.arDataReceived}

          statusDataState={this.state.statusData}
          onStatusDataReceived={this.statusDataReceived}

          siteUsersDataState={this.state.siteUsersData}
          onSiteUsersDataReceived={this.siteUserDataReceived}

          currentUserDataState={this.state.currentUser}
          onCurrentUserDataReceived={this.currentUserDataReceived}
        />
      </div >
    );
  }
}


export function MyCommandCell({ edit, cancel, approvalResponse, requestApproval, currentUser }) {
  return class extends GridCell {
    constructor(props) {
      super(props);
    }

    public render() {
      const { dataItem } = this.props;
      const needsApproval: Boolean = dataItem.Actions.some(y => y.Response_x0020_Status === InvoiceActionResponseStatus.Waiting && y.AssignedToId === currentUser.Id);

      const isNewItem = dataItem.ID === undefined;

      const onItemClick = (e) => {
        switch (e.item.text.toLowerCase()) {
          case "edit":
            edit(dataItem);
            break;
          case "cancel":
            cancel(dataItem);
            break;
          case "request user action":
            requestApproval(dataItem);
            break;
          default:
            break;
        }
      };

      const iconItems = [
        { text: "Edit", icon: "edit" },
        { text: "Cancel", icon: "cancel" },
        { text: "Request User Action", icon: "check" }
      ];

      const approveDenyItems = [
        { text: "Approve", icon: "check-outline" },
        { text: "Deny", icon: "close-outline" }
      ];

      return (
        <td className={this.props.className + " k-command-cell"} style={this.props.style}>
          <SplitButton items={iconItems} text={'Edit'} icon={'edit'} look="flat" onButtonClick={e => edit(dataItem)} onItemClick={(e) => onItemClick(e)} />
          {
            needsApproval &&
            <Button style={{ marginTop: '4px', marginBottom: '4px' }} primary={true} onClick={(e) => approvalResponse(dataItem)}>Approve/Deny</Button>
          }
        </td>
      );
    }
  };
}
