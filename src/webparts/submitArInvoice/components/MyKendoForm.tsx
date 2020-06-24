import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Form, Field, FormElement, FieldWrapper } from '@progress/kendo-react-form';
import { Error } from '@progress/kendo-react-labels';
import { Input } from '@progress/kendo-react-inputs'
import { Button } from '@progress/kendo-react-buttons';



import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import * as MyFormComponents from './MyFormComponents';
import { IMyFormProps } from './IMyFormProps';
import { IMyFormState } from './IMyFormState';
import * as MyValidators from './validators.jsx'
import {MyCustomerCardComponent} from './MyCustomerCardComponent';


export class MyForm extends React.Component<IMyFormProps, IMyFormState> {
  /**
   *
   */
  constructor(props) {
    super(props);
    console.log("MyForm CTOR");
    console.log(props);

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
  }

  render() {
    return (
      <div style={{ padding: '5px' }}>
        <Form
          onSubmit={this.handleSubmit}

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
                  defaultValue={new Date()}
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
                  textField="Company"
                  //validator={MyValidators.requiresApprovalFrom}
                  component={MyFormComponents.FormComboBox}
                  onChange={
                    (event) => {
                      console.log("Customer Changed");
                      console.log(event.target.value);
                      // TODO: Do I need to add '...this.state' as well?
                      this.setState({
                        selectedCustomer: event.target.value
                      });
                    }
                  }
                />
                <div style={{width:'100%'}}>
                  <MyCustomerCardComponent selectedCustomer={this.state.selectedCustomer}/>
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
