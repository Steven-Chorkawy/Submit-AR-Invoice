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

export class FinanceGridEditForm extends React.Component<IFinanceGridEditFormProps, any> {
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
        <Form
          onSubmit={this.props.onSubmit}
          initialValues={{ ...this.state.productInEdit }}
          render={(formRenderProps) => (
            <FormElement style={{ width: '100%' }}>
              {GridButtons({ cancel: this.props.cancel, saveResult: this.props.saveResult })}
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
                          // Do nothing because there will only be one option. 
                          onRequestTypeChange={e => { /**Do Nothing */ }}
                          requestOptions={[{ key: InvoiceActionRequestTypes.EditRequired, text: InvoiceActionRequestTypes.EditRequired }]}
                          requestType={InvoiceActionRequestTypes.EditRequired}
                          onDescriptionChange={this.props.onNoteToDepChange}
                        />
                      </div>
                    }
                  </div>
                  {
                    formRenderProps.valueGetter('Invoice_x0020_Status') !== InvoiceStatus["Accountant Approval Required"] &&
                    <div style={{ marginBottom: "2px" }}>
                      <Field
                        id="Requires_x0020_Accountant_x0020_"
                        name="Requires_x0020_Accountant_x0020_"
                        label="* Requires Approval From Accountant"
                        wrapperStyle={{ width: '100%' }}
                        dataItemKey="Email"
                        textField="Title"
                        hint={'Send an approval request to one or more users.'}
                        personSelectionLimit={1}
                        context={this.props.context}
                        selectedItems={e => {
                          if (e && e.length > 0) {
                            GetUsersByLoginName(e).then(res => {
                              formRenderProps.onChange('Requires_x0020_Accountant_x0020_', { value: res });
                            });
                          }
                        }}
                        component={MyFormComponents.FormPeoplePicker}
                      />
                    </div>
                  }
                  {
                    formRenderProps.valueGetter('Invoice_x0020_Status') !== InvoiceStatus["Entered into GP"] &&
                    <div style={{ marginBottom: '2px' }}
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
              {GridButtons({ cancel: this.props.cancel, saveResult: this.props.saveResult })}
            </FormElement>
          )}
        />
      </Dialog>
    );
  }
}
