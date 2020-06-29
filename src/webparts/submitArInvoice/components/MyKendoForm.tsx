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

    this._siteUrl = props.ctx.pageContext.web.absoluteUrl;

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
    // Users are allowed to submit this form without any attachments.
    // First I'm going to check if there are any attachments, if not I will upload a blank file and record the metadata they provided.
    if (!dataItem.hasOwnProperty('InvoiceAttachments')) {
      this.uploadNewFileAndSetMetadata(dataItem, "EmptyFile", null);
    }
    else {
      // 1 or more attachments are present.
      for (let index = 0; index < dataItem.InvoiceAttachments.length; index++) {
        const element = dataItem.InvoiceAttachments[index];
        this.uploadNewFileAndSetMetadata(dataItem, element.name, element.getRawFile());
      }
    }
  }

  /**
   * Upload a file to the document library and set its Metadata.
   * @param dataItem Data from form.
   */
  uploadNewFileAndSetMetadata = async (dataItem, fileName, rawFile) => {
    let web = Web(this._siteUrl);
    console.log("Uploading new File");
    console.log(dataItem);

    // Uploads the file to the document library.
    let uploadRes = await web.getFolderByServerRelativeUrl('/sites/FinanceTest/ARTest/AR%20Invoices/')
      .files
      .add(fileName, rawFile, true);

    console.log(uploadRes);

    // Gets the file that we just uploaded.  This will be used later to update the metadata.
    let file = await uploadRes.file.getItem();

    console.log(file);

    const myData = {
      Department: dataItem.Department,
      Date: dataItem.Date,
      Requested_x0020_ById: dataItem.RequestedBy.Id
    }

    console.log("Updating with this data");
    console.log(myData);
    await file.update(myData);
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
                component={MyFormComponents.CustomerComboBox}
              />
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
              />

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
