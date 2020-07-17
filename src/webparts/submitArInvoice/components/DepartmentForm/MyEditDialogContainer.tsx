import * as React from 'react';
import * as ReactDom from 'react-dom';

import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs';
import { Input, NumericTextBox } from '@progress/kendo-react-inputs';
import { Form, FormElement, Field, FieldArray } from '@progress/kendo-react-form';
import { Button } from '@progress/kendo-react-buttons';
import { Card, CardTitle, CardSubtitle, CardBody, CardActions } from '@progress/kendo-react-layout';

import * as MyFormComponents from '../MyFormComponents';
import * as MyValidators from '../validators.jsx';
import { MyFinanceGlAccountsComponent, MyFinanceGlAccounts } from '../MyFinanceGLAccounts';


export class MyEditDialogContainer extends React.Component<any, any> {
  constructor(props) {
    super(props);
    console.log("MyEditDialogContainer");
    console.log(props);
    this.state = {
      productInEdit: this.props.dataItem || null
    };
    this.props.dataItem.Requires_x0020_Authorization_x0020_ById.map(reqAuthId => {
      this.selectedReqApprovers.push(this.props.siteUsers.find(s => s.Id === reqAuthId))
    });
  }

  private selectedReqApprovers = [];

  handleSubmit(event) {
    event.preventDefault();
  }

  onDialogInputChange = (event) => {
    let target = event.target;
    let value = target.type === 'checkbox' ? target.checked : target.value;
    let name = (target.props && target.props.name !== undefined) ? target.props.name : (target.name !== undefined) ? target.name : target.props.id;
    // last chance.
    if (name === "" && target.id !== undefined) {
      name = target.id;
    }

    debugger;
    switch (name) {
      case 'RequestedBy':
        debugger;
        name = 'Requested_x0020_ById';
        value = value.Id;
        break;
      case 'RequiresAuthorizationBy':
        name = 'Requires_x0020_Authorization_x0020_ById';
        // TODO: Why can't I set the req auth value?!?!
        break;

      default:
        break;
    }

    const edited = this.state.productInEdit;
    edited[name] = value;

    this.setState({
      productInEdit: edited
    });
  }

  render() {
    return (
      <Dialog onClose={this.props.cancel} title={"Edit AR Invoice Request"} minWidth="200px" width="80%">
        <Form
          //onSubmit={this.handleSubmit}
          onSubmit={this.handleSubmit}

          initialValues={{
            Date: new Date(),
            Urgent: false,
            StandardTerms: 'NET 30, 1% INTEREST CHARGED',
            GLAccounts: [],
          }}

          render={(formRenderProps) => (
            <FormElement >

              <legend className={'k-form-legend'}>ACCOUNTS RECEIVABLE - INVOICE REQUISITION </legend>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Field
                  id="Department"
                  name="Department"
                  label="* Department"
                  wrapperStyle={{ width: '50%', marginRight: '18px' }}
                  data={[
                    'Administration',
                    'Clerks Department',
                    'Community Service',
                    'Corporate Services Department',
                    'Emergency Services',
                    'Engineering Services',
                    'Finance',
                    'Legal Services Department',
                    'Mayor & Council',
                    'Operations',
                    'Planning Services'
                  ]}
                  //validator={MyValidators.departmentValidator}
                  component={MyFormComponents.FormDropDownList}
                  value={this.state.productInEdit.Department}
                  onChange={this.onDialogInputChange}
                />

                <Field
                  id={'Date'}
                  name={'Date'}
                  label={'* Date'}
                  component={MyFormComponents.FormDatePicker}
                  //validator={MyValidators.dateValidator}
                  wrapperStyle={{ width: '50%' }}
                  value={new Date(this.state.productInEdit.Date)}
                  onChange={this.onDialogInputChange}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Field
                  id="RequestedBy"
                  name="RequestedBy"
                  label="* Requested By"
                  wrapperStyle={{ width: '50%', marginRight: '18px' }}
                  data={this.props.siteUsers}
                  dataItemKey="Email"
                  textField="Title"
                  //validator={MyValidators.requestedByValidator}
                  component={MyFormComponents.FormComboBox}
                  value={this.props.siteUsers.find(s => s.Id === this.state.productInEdit.Requested_x0020_ById)}
                  onChange={this.onDialogInputChange}
                />

                <Field
                  id="RequiresAuthorizationBy"
                  name="RequiresAuthorizationBy"
                  label="* Requires Authorization By"
                  wrapperStyle={{ width: '50%' }}
                  data={this.props.siteUsers}
                  dataItemKey="Email"
                  textField="Title"
                  //validator={MyValidators.requiresApprovalFrom}
                  component={MyFormComponents.FormMultiSelect}
                  value={this.selectedReqApprovers}

                  onChange={this.onDialogInputChange}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Field
                  id="Urgent"
                  name="Urgent"
                  label="Urgent"
                  onLabel="Yes"
                  offLabel="No"
                  component={MyFormComponents.FormSwitch}
                  value={this.state.productInEdit.Urgent}
                  onChange={this.onDialogInputChange}
                />
              </div>
              <Field
                id="Customer"
                name="Customer"
                label="* Customer"
                wrapperStyle={{ width: '100%' }}
                data={this.props.customers}
                dataItemKey="ID"
                textField="Title"
                //validator={MyValidators.requiresCustomer}
                allowCustom={true}
                component={MyFormComponents.CustomerComboBox}
                value={this.props.customers.find(f => f.Id === this.state.productInEdit.CustomerId)}
                onChange={this.onDialogInputChange}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Field
                  id="CustomerPONumber"
                  name="CustomerPONumber"
                  label="Customer PO Number"
                  ////validator={MyValidators.requiresCustomerPONUmber}
                  component={MyFormComponents.FormInput}
                  value={this.state.productInEdit.Customer_x0020_PO_x0020_Number}
                  onChange={this.onDialogInputChange}
                />

                <Field
                  id="StandardTerms"
                  name="StandardTerms"
                  label="Standard Terms"
                  wrapperStyle={{ width: '50%', marginRight: '18px' }}
                  defaultValue='NET 30, 1% INTEREST CHARGED'
                  data={[
                    'NET 30, 1% INTEREST CHARGED'
                  ]}
                  component={MyFormComponents.FormDropDownList}
                  onChange={this.onDialogInputChange}
                />
              </div>

              <Field
                id="Comment"
                name="Comment"
                label="Comments"
                value={this.state.productInEdit.Comment}
                component={MyFormComponents.FormTextArea}
                onChange={this.onDialogInputChange}
              />

              <Field
                id="InvoiceDetails"
                name="InvoiceDetails"
                label="Invoice Details"
                component={MyFormComponents.FormTextArea}
                value={this.state.productInEdit.Invoice_x0020_Details}
                onChange={this.onDialogInputChange}
              />

              <div style={{ width: '100%' }}>
                <FieldArray
                  name="GLAccounts"
                  component={MyFinanceGlAccountsComponent}
                  value={this.state.productInEdit.AccountDetails}
                />
              </div>

              <hr />
              <Card style={{ width: 400 }}>
                <CardBody>
                  <CardTitle>Related Attachments</CardTitle>
                  {
                    this.state.productInEdit.RelatedAttachments.map(f => {
                      return (
                        <a target='_blank' href={f.ServerRedirectedEmbedUrl} style={{ margin: '2px' }}>
                          <div className='k-chip k-chip-filled k-chip-info'>
                            <div className='k-chip-content'>
                              {f.Title}
                            </div>
                          </div>
                        </a>
                      );
                    })
                  }
                  <hr />
                  <Field
                    id="RelatedInvoiceAttachments"
                    name="RelatedInvoiceAttachments"
                    label="Upload Related Attachments"
                    batch={false}
                    multiple={true}
                    component={MyFormComponents.FormUpload}
                    myOnChange={this.onDialogInputChange}
                  />
                </CardBody>
              </Card>
            </FormElement>
          )} />
        <DialogActionsBar>
          <button
            className="k-button k-primary"
            onClick={this.props.save}
          >Save</button>
          <button
            className="k-button"
            onClick={this.props.cancel}
          >Cancel</button>
        </DialogActionsBar>
      </Dialog>
    );
  }
}
