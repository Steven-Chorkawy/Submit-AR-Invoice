import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Form, Field, FormElement, FieldWrapper, FieldArray } from '@progress/kendo-react-form';
import { Error } from '@progress/kendo-react-labels';
import { Input, MaskedTextBox } from '@progress/kendo-react-inputs'
import { Button } from '@progress/kendo-react-buttons';
import { Card, CardTitle, CardBody, CardActions } from '@progress/kendo-react-layout';
import { Grid, GridColumn, GridToolbar } from '@progress/kendo-react-grid';

import { sp } from "@pnp/sp";
import { Web } from "@pnp/sp/webs";
import "@pnp/sp/webs";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/lists";
import "@pnp/sp/items";

import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import * as MyFormComponents from './MyFormComponents';
import { IMyFormProps } from './IMyFormProps';
import { IMyFormState, IUploadingFile } from './IMyFormState';
import * as MyValidators from './validators.jsx'
import { MyCustomerCardComponent } from './MyCustomerCardComponent';
import { MyGLAccountComponent } from './MyGLAccountComponent';


export interface IARFormModel {
  Title: string;
  Department: string;
  Date: Date;
  Requested_x0020_ById: number;
  Requires_x0020_Authorization_x0020_ById: any;
  Comment: string;
  Invoice_x0020_Details: string;
  CustomerId: number;
  Standard_x0020_Terms: string;
  Urgent: boolean;
}


export interface IARAccountDetails {
  AR_x0020_InvoiceId: number;   //ID of Invoice
  Account_x0020_Code: string; // GL Code
  Amount: number;             // Amount for account
  HST_x0020_Taxable: boolean; // Is amount taxable?
}


export class MyForm extends React.Component<IMyFormProps, IMyFormState> {
  _siteUrl: string;

  /**
   *
   */
  constructor(props) {
    super(props);
    console.log("MyForm CTOR");
    console.log(this.props);

    this._siteUrl = props.ctx.pageContext.web.absoluteUrl;

    this.state = {
      MyFiles: [],
      ...props
    }
  }


  /**
   * Form Submit Event
   * @param dataItem Data from form
   */
  handleSubmit = (dataItem) => {
    // We will use this to update states later.
    let currentFiles: IUploadingFile[] = this.state.MyFiles;

    // Users are allowed to submit this form without any attachments.
    // First I'm going to check if there are any attachments, if not I will upload a blank file and record the metadata they provided.
    if (!dataItem.hasOwnProperty('InvoiceAttachments')) {
      this.uploadNewFileAndSetMetadata(dataItem, "EmptyFile", null)
        .then(file => {
          file.file.get().then(f => {
            currentFiles.push({
              FileName: f.Name,
              UploadSuccessful: true,
              ErrorMessage: null
            });

            this.setState({
              MyFiles: currentFiles
            })
          });
        })
        .catch((error) => {

          alert("Something went wrong!");
          console.log(error);

          currentFiles.push({
            FileName: "get file name",
            UploadSuccessful: false,
            ErrorMessage: error
          });

          this.setState({
            MyFiles: currentFiles
          })
        });
    }
    else {
      // 1 or more attachments are present.
      for (let index = 0; index < dataItem.InvoiceAttachments.length; index++) {
        const attachedFile = dataItem.InvoiceAttachments[index];
        this.uploadNewFileAndSetMetadata(dataItem, attachedFile.name, attachedFile.getRawFile())
          .then(file => {
            file.file.get().then(f => {
              currentFiles.push({
                FileName: f.Name,
                UploadSuccessful: true,
                ErrorMessage: null
              });

              this.setState({
                MyFiles: currentFiles
              })
            });

          })
          .catch((error) => {
            alert("Something went wrong!");
            console.log(error);

            currentFiles.push({
              FileName: "get file name",
              UploadSuccessful: false,
              ErrorMessage: error
            });

            this.setState({
              MyFiles: currentFiles
            })
          })
      }
    }
  }

  S4 = () => {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
  }

  /**
   * Upload a file to the document library and set its Metadata.
   * @param dataItem Data from form.
   */
  uploadNewFileAndSetMetadata = async (dataItem, fileName, rawFile) => {
    let web = Web(this._siteUrl);
    // Title = "Current year"-AR-"GUID"
    // 2020-AR-66d07df6-40a8-45e0-04c9-1b485ebc3aca
    let currentYear = new Date().getFullYear();
    debugger;
    const newARTitle = currentYear + "-AR-" + (this.S4() + this.S4() + "-" + this.S4() + "-4" + this.S4().substr(0,3) + "-" + this.S4() + "-" + this.S4() + this.S4() + this.S4()).toLowerCase();


    // Uploads the file to the document library.
    // TODO: Remove this hard coded value! Can we possibly get this from the web parts properties window? That would allow this web part to be used in multiple locations.
    let uploadRes = await web.getFolderByServerRelativeUrl('/sites/FinanceTest/ARTest/AR%20Invoices/')
      .files
      .add(newARTitle, rawFile, true);

    // Gets the file that we just uploaded.  This will be used later to update the metadata.
    let file = await uploadRes.file.getItem();


    // Set the data for the invoice
    let myData: IARFormModel = {
      Title: newARTitle,
      Department: dataItem.Department,
      Date: dataItem.Date,
      Requested_x0020_ById: dataItem.RequestedBy.Id,
      Requires_x0020_Authorization_x0020_ById: {
        'results': dataItem.RequiresAuthorizationBy.map((user) => { return user.Id })
      },
      CustomerId: dataItem.Customer.Id,
      Comment: dataItem.Comment,
      Invoice_x0020_Details: dataItem.InvoiceDetails,
      Standard_x0020_Terms: dataItem.StandardTerms,
      Urgent: dataItem.Urgent
    }
    const accounts: IARAccountDetails = { ...dataItem.GLAccounts }

    var output = await (await file.update(myData)).item;

    output.get().then(innerFile => {
      // Set the data for the account details.
      let accountDetails: IARAccountDetails[] = [];
      dataItem.GLAccounts.map(account => {
        accountDetails.push({
          AR_x0020_InvoiceId: innerFile.ID,
          Account_x0020_Code: account.GLCode,
          HST_x0020_Taxable: account.HSTTaxable,
          Amount: account.Amount
        });
      });

      this.addAccountCodes(accountDetails);
    })

    return output;
  }


  /**
   * Create the accounts for this invoice.
   *
   * @param accountDetails IARAccountDetails
   */
  addAccountCodes = async (accountDetails: IARAccountDetails[]) => {
    accountDetails.map(account => {
      sp.web.lists.getByTitle('AR Invoice Accounts').items.add(account);
    });
  }

  UploadStatusCard = () => {
    let output = [];

    this.state.MyFiles.map(f => {
      output.push(
        <Card type={f.UploadSuccessful ? 'success' : 'error'} style={{ margin: '2px' }}>
          <CardBody>
            <CardTitle>{f.FileName} - {f.UploadSuccessful ? 'Success!' : 'Error'}</CardTitle>
            <p>{f.ErrorMessage}</p>
          </CardBody>
        </Card>
      );
    });

    return output;
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
                  component={MyFormComponents.FormMultiSelect}
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


              <div style={{ width: '100%' }}>
                <FieldArray
                  name="GLAccounts"
                  component={MyGLAccountComponent}
                />
              </div>

              <hr />

              <Field
                id="InvoiceAttachments"
                name="InvoiceAttachments"
                label="Upload Attachments"
                batch={false}
                multiple={true}
                component={MyFormComponents.FormUpload}
              />
              <hr />


              <div className="k-form-buttons">
                <Button
                  primary={true}
                  type={'submit'}
                  icon="save"
                // disabled={!formRenderProps.allowSubmit}
                >Send AR Invoice Request</Button>
                <Button onClick={formRenderProps.onFormReset}>Clear</Button>
              </div>

              {(this.state.MyFiles.length > 0) && this.UploadStatusCard()}
            </FormElement>
          )} />
      </div>
    )
  }
}
