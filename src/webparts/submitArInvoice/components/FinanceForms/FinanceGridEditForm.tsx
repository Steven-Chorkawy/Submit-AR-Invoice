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
import * as MyFormComponents from '../MyFormComponents';
import { GLAccountsListViewComponent } from '../MyFinanceGLAccounts';
import { InvoiceActionRequestTypes, InvoiceStatus, MyContentTypes } from '../enums/MyEnums';
import { GetUsersByLoginName } from '../MyHelperMethods';
import { MyLists } from '../enums/MyLists';
import { IInvoiceItem } from '../interface/MyInterfaces';
import { MyAttachmentComponent } from '../MyAttachmentComponent';
import { RequestApprovalCardComponent } from '../RequestApprovalDialogComponent';
import { ActionStepsComponent } from '../ActionStepsComponent';
import { Label } from '@progress/kendo-react-labels';

export interface IGPAttachmentProps {
  type: string;
  errorMessage: string;
}

interface IFinanceGridEditFormProps {
  GPAttachmentWidgetProps: IGPAttachmentProps;
  dataItem: IInvoiceItem;
  onSubmit: any;
  cancel: any;
  saveResult: any;
  currentUser: any;
  statusData: any;
  siteUsersData: any;
  updateAccountDetails: any;


  onApproverChange: any;
  onNoteChange: any;

  context: any;
  onRelatedAttachmentAdd: Function;
  onRelatedAttachmentRemove: Function;
}

// function GridButtons({ cancel, saveResult }) {
//   return (
//     <div>
//       {saveResult && saveResult.success === false &&
//         <div>
//           <Card style={{ width: 600 }} type={'error'}>
//             <CardBody>
//               <CardTitle>Something went wrong!</CardTitle>
//               <hr />
//               <p>{saveResult.message}</p>
//             </CardBody>
//           </Card>
//         </div>}
//       <div className="k-form-buttons">
//         <Button
//           type={"submit"}
//           disabled={!this.state.allowSubmit}
//           style={{ width: '50%' }}
//           primary={true}
//           icon="save"
//         >Save</Button>
//         <Button
//           // type={"submit"}
//           style={{ width: '50%' }}
//           className="k-button"
//           onClick={cancel}
//           icon="cancel"
//         >Cancel</Button>
//       </div>
//     </div>
//   );
// }

export class FinanceGridEditForm extends React.Component<IFinanceGridEditFormProps, any> {
  constructor(props) {
    super(props);
    this.state = {
      productInEdit: this.props.dataItem || null,
      visible: false,
      approvalRequestError: false,
      allowSubmit: true
    };
  }

  public onDialogInputChange = e => {
    let target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = (target.props && target.props.name !== undefined) ? target.props.name : (target.name !== undefined) ? target.name : target.props.id;
    const edited = this.state.productInEdit;
    edited[name] = value;
    this.setState({
      productInEdit: edited
    });
  }

  public onActionResponseSent = e => {
    this.setState({
      productInEdit: null
    });
  }

  private onApproverChange = e => {
    if (e.length === 0) {
      this.setState({ allowSubmit: false });
    }
    this.props.onApproverChange(e);
  }

  private _statusValue = null;


  public GridButtons({ cancel, saveResult }) {
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
            disabled={!this.state.allowSubmit}
            style={{ width: '50%' }}
            primary={true}
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

  public render() {
    return (
      this.state.productInEdit && <Dialog onClose={this.props.cancel} title={"Edit AR Invoice"} minWidth="200px" width="80%" height="80%" >
        <Form
          onSubmit={this.props.onSubmit}
          initialValues={{ ...this.state.productInEdit }}
          render={(formRenderProps) => (
            <FormElement style={{ width: '100%' }}>
              {this.GridButtons({ cancel: this.props.cancel, saveResult: this.props.saveResult })}
              <div className='row'>
                <div className='col-sm-8'>
                  <div style={{ marginBottom: "2px" }}>
                    <Field
                      id={'Invoice_x0020_Status'}
                      name={'Invoice_x0020_Status'}
                      label={'Status'}
                      data={this.props.statusData}
                      component={MyFormComponents.FormDropDownList}
                    />
                    {
                      /**
                       * * Note: This is not a form component!  
                       * It's fields will not automatically be passed to this.props.onSubmit.
                       * The values of these fields must be passed through the state. 
                       */
                      formRenderProps.valueGetter('Invoice_x0020_Status') === InvoiceStatus["Hold for Department"] &&
                      this.state.productInEdit.Requested_x0020_By &&
                      this.props.dataItem.Invoice_x0020_Status !== InvoiceStatus["Hold for Department"] &&
                      <div>
                        <RequestApprovalCardComponent
                          context={this.props.context}
                          defaultUsers={[this.state.productInEdit.Requested_x0020_By.EMail]}
                          // Do nothing.
                          onRequestTypeChange={e => { }}
                          requestOptions={[{ key: InvoiceActionRequestTypes.EditRequired, text: InvoiceActionRequestTypes.EditRequired }]}
                          requestType={InvoiceActionRequestTypes.EditRequired}
                          onPeoplePickerChange={this.onApproverChange}
                          onDescriptionChange={this.props.onNoteChange}
                        />
                      </div>
                    }
                  </div>
                  {
                    formRenderProps.valueGetter('Invoice_x0020_Status') === InvoiceStatus["Accountant Approval Required"] &&
                    this.props.dataItem.Invoice_x0020_Status !== InvoiceStatus["Accountant Approval Required"] &&
                    <div style={{ marginBottom: "2px" }}>
                      <RequestApprovalCardComponent
                        context={this.props.context}
                        onRequestTypeChange={e => { }}
                        requestOptions={[{ key: InvoiceActionRequestTypes.AccountantApprovalRequired, text: InvoiceActionRequestTypes.AccountantApprovalRequired }]}
                        requestType={InvoiceActionRequestTypes.AccountantApprovalRequired}
                        onPeoplePickerChange={this.onApproverChange}
                        onDescriptionChange={this.props.onNoteChange}
                      />
                    </div>
                  }
                  {
                    formRenderProps.valueGetter('Invoice_x0020_Status') === InvoiceStatus["Entered into GP"] &&
                    this.props.dataItem.Invoice_x0020_Status !== InvoiceStatus["Entered into GP"] &&
                    <div style={{ marginBottom: '2px' }}
                    >
                      <RequestApprovalCardComponent
                        context={this.props.context}
                        // Do nothing because there will only be one option. 
                        onRequestTypeChange={e => { }}
                        requestOptions={[{ key: InvoiceActionRequestTypes.AccountingClerkApprovalRequired, text: InvoiceActionRequestTypes.AccountingClerkApprovalRequired }]}
                        requestType={InvoiceActionRequestTypes.AccountingClerkApprovalRequired}

                        onPeoplePickerChange={this.onApproverChange}
                        onDescriptionChange={this.props.onNoteChange}
                      />
                    </div>
                  }

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
                      component={GLAccountsListViewComponent}
                      value={this.state.productInEdit.AccountDetails}
                      productInEdit={this.state.productInEdit}
                      updateAccountDetails={this.props.updateAccountDetails}
                    />
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

                </div>
                <div className='col-sm-4'>
                  <Label>Approval Requests</Label>
                  <ActionStepsComponent actions={this.props.dataItem.Actions} />
                </div>
              </div>
              {this.GridButtons({ cancel: this.props.cancel, saveResult: this.props.saveResult })}
            </FormElement>
          )}
        />
      </Dialog>
    );
  }
}
