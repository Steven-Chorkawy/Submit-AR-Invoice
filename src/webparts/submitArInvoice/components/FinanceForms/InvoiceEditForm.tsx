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
import { ApprovalResponseComponent } from '../ApprovalResponseComponent';
import { InvoiceStatus, MyGridStrings, MyContentTypes } from '../enums/MyEnums';
import { MyRelatedAttachmentComponent } from '../MyRelatedAttachmentComponent';
import { ConvertQueryParamsToKendoFilter, BuildGUID } from '../MyHelperMethods';
import { ApprovalRequiredComponent } from '../ApprovalRequiredComponent';
import { InvoiceGridDetailComponent } from '../InvoiceGridDetailComponent';
import { MyLists } from '../enums/MyLists';
import { deleteable } from '@pnp/sp/sharepointqueryable';


export interface IGPAttachmentProps {
  type: string;
  errorMessage: string;
}

interface IInvoiceEditFormProps {
  GPAttachmentWidgetProps: IGPAttachmentProps;
  dataItem;
  cancel;
  currentUser;
  statusData;
  siteUsersData;
  onUpdateAccount;
  save;
}

export class InvoiceEditForm extends React.Component<IInvoiceEditFormProps, any> {
  constructor(props) {
    super(props);
    console.log('InvoiceEditForm');
    console.log(props);
    this.state = {
      productInEdit: this.props.dataItem || null,
      visible: false,
      approvalRequestError: false
    };
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
      <Dialog onClose={this.props.cancel} title={"Edit AR Invoice"} minWidth="200px" width="80%" height="80%" >
        <ApprovalRequiredComponent
          productInEdit={this.state.productInEdit}
          currentUser={this.props.currentUser}
        />
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
                  />
                </div>
                <div style={{ marginBottom: "2px" }}>
                  <Card style={{ width: 400 }} type={this.props.GPAttachmentWidgetProps.type}>
                    <CardBody>
                      <CardTitle><b>Upload GP Attachment</b></CardTitle>
                      <p>{this.props.GPAttachmentWidgetProps.errorMessage}</p>
                      <Field
                        id="InvoiceAttachments"
                        name="InvoiceAttachments"
                        batch={false}
                        multiple={false}
                        myOnChange={this.onDialogInputChange}
                        component={MyFormComponents.FormUpload}
                      />
                    </CardBody>
                  </Card>
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