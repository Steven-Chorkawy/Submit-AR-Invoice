import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Form, Field, FormElement, FieldWrapper, FieldArray } from '@progress/kendo-react-form';
import { Error } from '@progress/kendo-react-labels';
import { Input, MaskedTextBox } from '@progress/kendo-react-inputs'
import { Button } from '@progress/kendo-react-buttons';
import { Grid, GridColumn, GridToolbar } from '@progress/kendo-react-grid';

import { sp } from "@pnp/sp";
import { Web } from "@pnp/sp/webs";
import "@pnp/sp/webs";
import "@pnp/sp/files";
import "@pnp/sp/folders";

import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import * as MyFormComponents from './MyFormComponents';
import { IMyFormProps } from './IMyFormProps';
import { IMyFormState } from './IMyFormState';
import * as MyValidators from './validators.jsx'
import { MyCustomerCardComponent } from './MyCustomerCardComponent';
import { MyGLAccountComponent } from './MyGLAccountComponent';


export class MyForm extends React.Component<IMyFormProps, IMyFormState> {
  _siteUrl: string;

  /**
   *
   */
  constructor(props) {
    super(props);
    console.log("MyForm CTOR");
    console.log(props);

    this._siteUrl = props.ctx.pageContext.web.absoluteUrl;
    console.log("Site: " + this._siteUrl);

    this.state = {
      selectedCustomer: undefined,
      ...props
    }
  }

  /**
   * Form Submit Event
   * @param dataItem Data from form
   */
  handleSubmit = (dataItem) => {
    console.log(dataItem);
    alert(JSON.stringify(dataItem, null, 2));

    // ! For testing only.  This will need to be a loop for production.
    let thisFile = dataItem.InvoiceAttachments[0];
    let web = Web(this._siteUrl);

    web.getFolderByServerRelativeUrl('/sites/FinanceTest/ARTest/AR%20Invoices/')
      .files
      .add(thisFile.name, thisFile.getRawFile(), true)
      .then((data) => {
        console.log("File Upload!!");
        console.log(data);
      });
  }

  render() {
    return (
      <div style={{ padding: '5px' }}>
        <Form
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

              {/* <div style={{ display: 'flex', justifyContent: 'space-between' }}>
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
                  validator={MyValidators.departmentValidator}
                  component={MyFormComponents.FormDropDownList}
                />

                <Field
                  id={'Date'}
                  name={'Date'}
                  label={'* Date'}
                  component={MyFormComponents.FormDatePicker}
                  validator={MyValidators.dateValidator}
                  wrapperStyle={{ width: '50%' }}
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
                  validator={MyValidators.requestedByValidator}
                  component={MyFormComponents.FormComboBox}
                />

                <Field
                  id="RequiresAuthorizationBy"
                  name="RequiresAuthorizationBy"
                  label="* Requires Authorization By"
                  wrapperStyle={{ width: '50%' }}
                  data={this.props.siteUsers}
                  dataItemKey="Email"
                  textField="Title"
                  validator={MyValidators.requiresApprovalFrom}
                  component={MyFormComponents.FormComboBox}
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
                />
              </div>
              <Field
                id="Customer"
                name="Customer"
                label="* Customer"
                wrapperStyle={{ width: '100%' }}
                data={this.props.customerList}
                dataItemKey="ID"
                textField="Title"
                validator={MyValidators.requiresCustomer}
                component={MyFormComponents.FormComboBox}
              // onChange={
              //   (event) => {
              //     console.log("Customer Changed");
              //     console.log(event.target.value);
              //     // TODO: Do I need to add '...this.state' as well?
              //     this.setState({
              //       selectedCustomer: event.target.value
              //     });
              //   }
              // }
              />
              <div style={{ width: '100%' }}>
                <MyCustomerCardComponent selectedCustomer={this.state.selectedCustomer} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Field
                  id="CustomerPONumber"
                  name="CustomerPONumber"
                  label="* Customer PO Number"
                  validator={MyValidators.requiresCustomerPONUmber}
                  component={MyFormComponents.FormInput}
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
                />
              </div>

              <Field
                id="Comment"
                name="Comment"
                label="Comments"
                component={MyFormComponents.FormTextArea}
              />

              <Field
                id="InvoiceDetails"
                name="InvoiceDetails"
                label="Invoice Details"
                component={MyFormComponents.FormTextArea}
              />

              <Field
                id="InvoiceAttachments"
                name="InvoiceAttachments"
                label="Upload Attachments"
                batch={false}
                multiple={true}
                component={MyFormComponents.FormUpload}
              /> */}

              <div style={{ width: '100%' }}>
              <FieldArray
                        name="GLAccounts"
                        component={MyGLAccountComponent}
                    />
              </div>

              <div className="k-form-buttons">
                <Button
                  primary={true}
                  type={'submit'}
                // disabled={!formRenderProps.allowSubmit}
                >Send Reservation Request</Button>
                <Button onClick={formRenderProps.onFormReset}>Clear</Button>
              </div>
            </FormElement>
          )} />
      </div>
    )
  }
}
