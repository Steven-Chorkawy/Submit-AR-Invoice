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
import { InvoiceActionRequestTypes } from '../enums/MyEnums';
import { FinanceGridEditForm, IGPAttachmentProps } from './FinanceGridEditForm';
import { FileRefCell } from '../FileRefCell';
import { IDCell } from '../IDCell';
import { IMySaveResult } from '../interface/IMySaveResult';
import { QuickFilterButtonGroup } from '../QuickFilterButtonGroup';
import { IInvoiceUpdateItem } from '../interface/InvoiceItem';


interface IFinanceGridState {
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

class FinanceGrid extends React.Component<any, IFinanceGridState> {
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
    // These status should not be visible in the Finance form as per Al Baker. 
    // * See issue https://github.com/Steven-Chorkawy/Submit-AR-Invoice/issues/71
    let hideThese = [
      'Submitted',
      'Approved',
      'Rejected'
    ];

    for (let index = 0; index < hideThese.length; index++) {
      status.splice(status.indexOf(hideThese[index]), 1);
    }

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
  public removeRelatedAttachments = (element, invoiceId) => {
    let invoiceIndex = this.state.invoices.data.findIndex(f => f.Id === invoiceId);
    let dataState = this.state.invoices.data;
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

            let invoiceIndex = this.state.invoices.data.findIndex(f => f.Id === invoiceId);
            let dataState = this.state.invoices.data;
            dataState[invoiceIndex].RelatedAttachments.push(thisNewFileMetadata);

            this.setState({
              invoices: {
                data: dataState,
                total: dataState.length
              }
            });
          });
      });
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

  public onNoteToDepChange = (e) => {
    this.setState({
      noteForDepartment: e.target.value
    });
  }
  //#endregion Update Methods

  //#region CRUD Methods
  public itemChange = (event) => {
    console.log('itemChange');
    console.log(event);
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
    this.setState({ productInEdit: Object.assign({}, dataItem) });
  }

  /**
   * onSubmit
   */
  public handleSubmit(event) {
    console.log('handleSubmit');
    console.log(event);

    // TODO: We should also be getting the accountant whos approval is require. 
    // TODO: We should also be getting the accounting clerk 2 whos approval is required.
    let updateProperties = {
      Invoice_x0020_Status: event.Invoice_x0020_Status,
      Invoice_x0020_Number: event.Invoice_x0020_Number,
      Batch_x0020_Number: event.Batch_x0020_Number
    };

    console.log(updateProperties);
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
          <GridColumn field="ID" title="ID" width={this._columnWidth} editable={false} cell={(props) => <IDCell {...props} />} />
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
          <FinanceGridEditForm
            currentUser={this.state.currentUser}
            dataItem={this.state.productInEdit}
            statusData={this.state.statusData}
            siteUsersData={this.state.siteUsersData}
            onSubmit={this.handleSubmit}
            onNoteToDepChange={this.onNoteToDepChange}
            saveResult={this.state.saveResult}
            cancel={this.cancelEditForm}
            updateAccountDetails={(e) => {
              // e will be a list of all the accounts.              
              let invoiceIndex = this.state.invoices.data.findIndex(f => f.Id === this.state.productInEdit.ID);
              let dataState = this.state.invoices.data;
              dataState[invoiceIndex].AccountDetails = [...e];
              this.setState({
                invoices: {
                  data: dataState,
                  total: dataState.length
                },
                productInEdit: { ...this.state.productInEdit, AccountDetails: [...e] }
              });
            }}
            onRelatedAttachmentAdd={this.updateRelatedAttachments}
            onRelatedAttachmentRemove={this.removeRelatedAttachments}
            GPAttachmentWidgetProps={this.state.gpAttachmentProps}
            context={this.props.context}
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

export { FinanceGrid };