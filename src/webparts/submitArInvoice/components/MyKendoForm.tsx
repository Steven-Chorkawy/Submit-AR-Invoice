import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Form, Field, FormElement, FieldWrapper, FieldArray } from '@progress/kendo-react-form';
import { Error } from '@progress/kendo-react-labels';
import { Input, MaskedTextBox } from '@progress/kendo-react-inputs';
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
import * as MyValidators from './validators.jsx';
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
  Customer_x0020_PO_x0020_Number: any;
}


export interface IARAccountDetails {
  AR_x0020_InvoiceId: number;   //ID of Invoice
  Account_x0020_Code: string; // GL Code
  Amount: number;             // Amount for account
  HST_x0020_Taxable: boolean; // Is amount taxable?
}


export class MyForm extends React.Component<IMyFormProps, IMyFormState> {
  private _siteUrl: string;

  /**
   *
   */
  constructor(props) {
    super(props);

    this._siteUrl = props.ctx.pageContext.web.absoluteUrl;

    this.state = {
      MyFiles: [],
      productInEdit: {},
      ...props
    };
  }


  /**
   * Form Submit Event
   * @param dataItem Data from form
   */
  public handleSubmit = async (dataItem) => {
    debugger;
    console.log("handleSubmit");
    console.log(dataItem);
    Object.keys(dataItem).length

    if (!dataItem.hasOwnProperty('RequestedBy')) {
      console.log("Empty Object.");
      return;
    }


    // We will use this to update states later.
    let currentFiles: IUploadingFile[] = this.state.MyFiles;


    debugger;

    let web = Web(this._siteUrl);
    let currentYear = new Date().getFullYear();
    const newARTitle = currentYear + "-AR-" + (this.S4() + this.S4() + "-" + this.S4() + "-4" + this.S4().substr(0, 3) + "-" + this.S4() + "-" + this.S4() + this.S4() + this.S4()).toLowerCase();
    let finalFileName = newARTitle + '.pdf'; // .pdf because GP exports pdf files.  Finance will replace this place holder file in the future.
    // TODO: Remove this hard coded value! Can we possibly get this from the web parts properties window? That would allow this web part to be used in multiple locations.
    //? Can i upload a string as file content?
    let uploadRes = await web.getFolderByServerRelativeUrl('/sites/FinanceTest/ARTest/AR%20Invoices/')
      .files
      .add(finalFileName, "Placeholder file until invoice from GP is uploaded", true);

    console.log("handleSubmit1");
    // Gets the file that we just uploaded.  This will be used later to update the metadata.
    let newUploadedFile = await uploadRes.file.getItem();
    const uploadedFile: any = Object.assign({}, newUploadedFile);
    console.log("handleSubmit2");

    console.log(uploadedFile);
    debugger;


    // Set the data for the invoice
    let myData: IARFormModel = {
      Title: newARTitle,
      Department: dataItem.Department,
      Date: dataItem.Date,
      Requested_x0020_ById: dataItem.RequestedBy.Id,
      Requires_x0020_Authorization_x0020_ById: {
        'results': dataItem.RequiresAuthorizationBy.map((user) => { return user.Id; })
      },
      CustomerId: dataItem.Customer.Id,
      Comment: dataItem.Comment,
      Customer_x0020_PO_x0020_Number: dataItem.CustomerPONumber,
      Invoice_x0020_Details: dataItem.InvoiceDetails,
      Standard_x0020_Terms: dataItem.StandardTerms,
      Urgent: dataItem.Urgent
    };

    const accounts: IARAccountDetails = { ...dataItem.GLAccounts };

    var output = await (await sp.web.lists.getByTitle('AR Invoices').items.getById(uploadedFile.ID).update(myData)).item;

    //var output = await (await newUploadedFile.update(myData)).item;
    console.log("handleSubmit3");
    console.log(output);


    output.get().then(innerFile => {
      console.log("innerFile1");
      console.log(innerFile);
      // Set the data for the account details.
      let accountDetails: IARAccountDetails[] = [];
      dataItem.GLAccounts.map(account => {
        console.log("innerFile mapping");
        accountDetails.push({
          AR_x0020_InvoiceId: innerFile.ID,
          Account_x0020_Code: account.GLCode,
          HST_x0020_Taxable: account.HSTTaxable,
          Amount: account.Amount
        });
      });

      console.log("handleSubmit4");


      this.addAccountCodes(accountDetails, output);

      console.log("handleSubmit5");

      if (dataItem.RelatedInvoiceAttachments) {
        for (let index = 0; index < dataItem.RelatedInvoiceAttachments.length; index++) {
          const element = dataItem.RelatedInvoiceAttachments[index];
          web.getFolderByServerRelativeUrl('/sites/FinanceTest/ARTest/RelatedInvoiceAttachments/')
            .files
            .add(element.name, element.getRawFile(), true)
            .then(uploadResponse => {
              uploadResponse.file.getItem()
                .then(item => {
                  item.update({
                    ARInvoiceId: innerFile.ID
                  });
                });
            });
        }
      }
    });
    console.log("handleSubmit6");
    output.file.get().then(f => {
      currentFiles.push({
        FileName: f.Name,
        UploadSuccessful: true,
        ErrorMessage: null
      });
      console.log("set final status");
      this.setState({
        MyFiles: currentFiles
      });
    });

    console.log("handleSubmit7");
  }

  /**
   * handleSubmit2
   */
  public handleSubmit2 = async (event) => {
    event.preventDefault();
  }

  private S4 = () => {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  }


  public uploadRelatedFiles = async (inputData, mainFile) => {

    let web = Web(this._siteUrl);

    for (let index = 0; index < inputData.RelatedAttachments.length; index++) {
      const element = inputData.RelatedAttachments[index];

      let uploadRes = await web.getFolderByServerRelativeUrl('/sites/FinanceTest/ARTest/RelatedInvoiceAttachments/')
        .files
        .add(element.name, element.getRawFile(), true)
        .then(({ file }) => file.getItem()
          .then((item: any) => {
            return item.update({
              ARInvoiceId: mainFile.Id
            });
          })
        );
    }
  }

  /**
   * Create the accounts for this invoice.
   *
   * @param accountDetails IARAccountDetails
   */
  public addAccountCodes = async (accountDetails: IARAccountDetails[], file) => {
    accountDetails.map(account => {
      sp.web.lists.getByTitle('AR Invoice Accounts').items.add(account)
        .then(f => {
          // Connect the account to the document list.
          file.update({
            AccountDetailsId: {
              results: [f.data.ID]
            }
          });
        });
    });
  }

  public UploadStatusCard = () => {
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
      <div style={{ padding: '5px' }}>
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
                  validator={MyValidators.departmentValidator}
                  component={MyFormComponents.FormDropDownList}
                //onchange={this.onDialogInputChange}
                />

                <Field
                  id={'Date'}
                  name={'Date'}
                  label={'* Date'}
                  component={MyFormComponents.FormDatePicker}
                  validator={MyValidators.dateValidator}
                  wrapperStyle={{ width: '50%' }}
                //onchange={this.onDialogInputChange}
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
                //onchange={this.onDialogInputChange}
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
                //onchange={this.onDialogInputChange}
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
                //onchange={this.onDialogInputChange}
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
              //onchange={this.onDialogInputChange}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Field
                  id="CustomerPONumber"
                  name="CustomerPONumber"
                  label="* Customer PO Number"
                  validator={MyValidators.requiresCustomerPONUmber}
                  component={MyFormComponents.FormInput}
                //onchange={this.onDialogInputChange}
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
                //onchange={this.onDialogInputChange}
                />
              </div>

              <Field
                id="Comment"
                name="Comment"
                label="Comments"
                component={MyFormComponents.FormTextArea}
              //onchange={this.onDialogInputChange}
              />

              <Field
                id="InvoiceDetails"
                name="InvoiceDetails"
                label="Invoice Details"
                component={MyFormComponents.FormTextArea}
              //onchange={this.onDialogInputChange}
              />


              <div style={{ width: '100%' }}>
                <FieldArray
                  name="GLAccounts"
                  component={MyGLAccountComponent}
                //onchange={this.onDialogInputChange}
                />
              </div>

              <hr />

              <Field
                id="RelatedInvoiceAttachments"
                name="RelatedInvoiceAttachments"
                label="Upload Related Attachments"
                batch={false}
                multiple={true}
                component={MyFormComponents.FormUpload}
              //onchange={this.onDialogInputChange}
              />
              <hr />

              <div className="k-form-buttons">
                <Button
                  primary={true}
                  type={'submit'}
                  icon="save"
                  onClick={this.handleSubmit}
                // disabled={!formRenderProps.allowSubmit}
                >Send AR Invoice Request</Button>
                <Button onClick={formRenderProps.onFormReset}>Clear</Button>
              </div>

              {(this.state.MyFiles.length > 0) && this.UploadStatusCard()}
            </FormElement>
          )} />
      </div>
    );
  }
}

