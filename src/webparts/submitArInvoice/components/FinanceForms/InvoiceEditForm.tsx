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
import { Card, CardTitle, CardSubtitle, CardBody, CardActions } from '@progress/kendo-react-layout';

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
import { ActionResponseComponent } from '../ActionResponseComponent';
import { InvoiceStatus, MyGridStrings, MyContentTypes } from '../enums/MyEnums';
import { ConvertQueryParamsToKendoFilter, BuildGUID } from '../MyHelperMethods';
import { ApprovalRequiredComponent } from '../ApprovalRequiredComponent';
import { InvoiceGridDetailComponent } from '../InvoiceGridDetailComponent';
import { MyLists } from '../enums/MyLists';
import { InvoiceActionResponseStatus } from '../enums/MyEnums';
import { IInvoiceItem } from '../interface/InvoiceItem';
import { MyAttachmentComponent } from '../MyAttachmentComponent';


export interface IGPAttachmentProps {
  type: string;
  errorMessage: string;
}

interface IInvoiceEditFormProps {
  GPAttachmentWidgetProps: IGPAttachmentProps;
  dataItem: IInvoiceItem;
  onSubmit: any;
  cancel: any;
  saveResult: any;
  currentUser: any;
  statusData: any;
  siteUsersData: any;
  updateAccountDetails: any;
  onNoteToDepChange?: any;
  context: any;
  onRelatedAttachmentAdd: Function;
  onRelatedAttachmentRemove: Function;
}

function GridButtons({ cancel, saveResult }) {
  return (
    <div>
      {saveResult && saveResult.success === false &&
        <div>
          <Card style={{ width: 600 }} type={'error'}>
            <CardBody>
              <CardTitle>Something went wrong!</CardTitle>
              <hr />
              <p>{saveResult.message}</p>
            </CardBody>
          </Card>
        </div>}
      <div className="k-form-buttons">
        <Button
          type={"submit"}
          style={{ width: '50%' }}
          className="k-button k-primary"
          icon="save"
        >Save</Button>
        <Button
          // type={"submit"}
          style={{ width: '50%' }}
          className="k-button"
          onClick={cancel}
          icon="cancel"
        >Cancel</Button>
      </div>
    </div>
  );
}

export class InvoiceEditForm extends React.Component<IInvoiceEditFormProps, any> {
  constructor(props) {
    super(props);
    this.state = {
      productInEdit: this.props.dataItem || null,
      visible: false,
      approvalRequestError: false
    };
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

  public onActionResponseSent = (e) => {
    this.setState({
      productInEdit: null
    });
  }



  private _statusValue = null;

  public render() {
    return (
      this.state.productInEdit && <Dialog onClose={this.props.cancel} title={"Edit AR Invoice"} minWidth="200px" width="80%" height="80%" >
        {this.state.productInEdit.ContentTypeId === MyContentTypes["AR Request List Item"] ? "Content Type: Invoice Request" : "Invoice Document"}
        {this.state.productInEdit.Actions &&
          this.state.productInEdit.Actions
            .filter(f => f.AssignedToId === this.props.currentUser.Id && f.Response_x0020_Status === InvoiceActionResponseStatus.Waiting)
            .map(action => {
              return (<ApprovalRequiredComponent
                action={action}
                productInEdit={this.state.productInEdit}
                currentUser={this.props.currentUser}
                onActionSentCallBack={this.onActionResponseSent}
              />);
            })
        }
        <Form
          onSubmit={this.props.onSubmit}
          initialValues={{ ...this.state.productInEdit }}
          render={(formRenderProps) => (
            <FormElement style={{ width: '100%' }}>
              {GridButtons({ cancel: this.props.cancel, saveResult: this.props.saveResult })}
              <fieldset className={'k-form-fieldset'}>
                <div style={{ marginBottom: "2px" }}>
                  <Field
                    id={'Invoice_x0020_Status'}
                    name={'Invoice_x0020_Status'}
                    label={'Status'}
                    data={this.props.statusData}
                    component={MyFormComponents.FormDropDownList}
                  />
                  {
                    formRenderProps.valueGetter('Invoice_x0020_Status') === InvoiceStatus["Hold for Department"] &&
                    this.state.productInEdit.Requested_x0020_By &&
                    this.props.dataItem.Invoice_x0020_Status !== InvoiceStatus["Hold for Department"] &&
                    < div >
                      <hr />
                      <Card style={{ paddingTop: '10px' }}>
                        <CardTitle style={{ marginBottom: '0px' }}>Send note to {this.state.productInEdit.Requested_x0020_By.Title}</CardTitle>
                        <CardBody>
                          <textarea style={{ width: '100%' }} onChange={this.props.onNoteToDepChange}></textarea>
                        </CardBody>
                        <CardActions orientation='vertical'>
                          <Button>{'Send & Save'}</Button>
                        </CardActions>
                      </Card>
                      <hr />
                    </div>
                  }
                </div>
                <div style={{ marginBottom: "2px" }}>
                  <Field
                    id={
                      this.state.productInEdit.ContentTypeId === MyContentTypes["AR Request List Item"]
                        ? 'Requires_x0020_Accountant_x0020_'
                        : 'Requires_x0020_Accountant_x0020_Approval'
                    }
                    name={
                      this.state.productInEdit.ContentTypeId === MyContentTypes["AR Request List Item"]
                        ? 'Requires_x0020_Accountant_x0020_'
                        : 'Requires_x0020_Accountant_x0020_Approval'
                    }
                    label="Requires Approval From Accountant"
                    data={this.props.siteUsersData}
                    dataItemKey="Id"
                    textField="Title"
                    // * valueGetter is a very nice method! No need to set the state anymore.
                    disabled={formRenderProps.valueGetter('Invoice_x0020_Status') !== InvoiceStatus["Accountant Approval Required"]}
                    component={MyFormComponents.FormComboBox}
                    hint={`To enable set status to 'Accountant Approval Required'`}
                  />
                </div>
                <div
                  style={{ marginBottom: '2px' }}
                  hidden={
                    formRenderProps.valueGetter('Invoice_x0020_Status') !== InvoiceStatus["Entered into GP"]
                    && this.state.productInEdit.RequiresAccountingClerkTwoApprovId === null
                  }
                >
                  <Field
                    id={
                      this.state.productInEdit.ContentTypeId === MyContentTypes["AR Request List Item"]
                        ? 'RequiresAccountingClerkTwoApprov'
                        : 'RequiresAccountingClerkTwoApproval'
                    }
                    name={
                      this.state.productInEdit.ContentTypeId === MyContentTypes["AR Request List Item"]
                        ? 'RequiresAccountingClerkTwoApprov'
                        : 'RequiresAccountingClerkTwoApproval'
                    }
                    label="Requires Approval From Accounting Clerk 2"
                    data={this.props.siteUsersData}
                    dataItemKey="Id"
                    textField="Title"
                    disabled={formRenderProps.valueGetter('Invoice_x0020_Status') !== InvoiceStatus["Entered into GP"]}
                    component={MyFormComponents.FormComboBox}
                    hint={`To enable set status to 'Entered into GP'`}
                  />
                </div>
                <div style={{ marginBottom: "2px" }}>
                  <Field
                    id={'Invoice_x0020_Number'}
                    name={'Invoice_x0020_Number'}
                    label={'Invoice Number'}
                    component={MyFormComponents.FormInput}
                  />
                </div>
                <div style={{ marginBottom: "2px" }}>
                  <Field
                    id={'Batch_x0020_Number'}
                    name={'Batch_x0020_Number'}
                    label={'Batch Number'}
                    component={MyFormComponents.FormInput}
                  />
                </div>
                <div style={{ marginBottom: "2px" }}>
                  <FieldArray
                    name="GLAccounts"
                    component={MyFinanceGlAccountsComponent}
                    value={this.state.productInEdit.AccountDetails}
                    productInEdit={this.state.productInEdit}
                    updateAccountDetails={this.props.updateAccountDetails}
                  />
                </div>
                <div style={{ marginBottom: "2px" }}>
                  <Card style={{ width: 400 }} type={this.props.GPAttachmentWidgetProps.type}>
                    <CardBody>
                      <CardTitle><b>Upload GP Attachment</b></CardTitle>
                      <p>{this.props.GPAttachmentWidgetProps.errorMessage}</p>
                      {
                        this.state.productInEdit.ContentTypeId === MyContentTypes["AR Invoice Document Item"] &&
                        this.state.productInEdit.ServerRedirectedEmbedUrl &&
                        <a target='_blank' href={this.state.productInEdit.ServerRedirectedEmbedUrl} style={{ margin: '2px' }}>
                          <div className='k-chip k-chip-filled k-chip-info'>
                            <div className='k-chip-content'>
                              {this.state.productInEdit.Title}
                            </div>
                          </div>
                        </a>
                      }

                      {
                        /**
                         * Only show this upload box if we're working with a request. If it not a request that means the file has already been uploaded.
                         *
                         * If Finance ever needs to re upload a file they should delete this one and restart the upload process.
                         * This is because the meta data will be applied to the NEW file.
                         * */
                        this.state.productInEdit.ContentTypeId === MyContentTypes["AR Request List Item"] &&
                        <Field
                          id="InvoiceAttachments"
                          name="InvoiceAttachments"
                          batch={false}
                          multiple={false}
                          myOnChange={this.onDialogInputChange}
                          component={MyFormComponents.FormUpload}
                        />
                      }
                    </CardBody>
                  </Card>
                </div>
                <div style={{ marginBottom: "2px" }}>
                  <MyAttachmentComponent
                    id="RelatedAttachments"
                    cardTitle="Upload Related Attachments"
                    productInEdit={this.state.productInEdit}
                    context={this.props.context}
                    documentLibrary={MyLists["Related Invoice Attachments"]}
                    onAdd={this.props.onRelatedAttachmentAdd}
                    onRemove={this.props.onRelatedAttachmentRemove}
                  />
                </div>
              </fieldset>
              {GridButtons({ cancel: this.props.cancel, saveResult: this.props.saveResult })}
            </FormElement>
          )}
        />
      </Dialog>
    );
  }
}
