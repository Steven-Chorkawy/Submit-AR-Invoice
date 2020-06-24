import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Form, Field, FormElement, FieldWrapper } from '@progress/kendo-react-form';
import { Error } from '@progress/kendo-react-labels';
import { Input } from '@progress/kendo-react-inputs'
import { Button } from '@progress/kendo-react-buttons';

import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import * as MyFormComponents from './MyFormComponents';
import { IMyFormProps } from './IMyFormProps';
import * as MyValidators from './validators.jsx'


export class MyForm extends React.Component<IMyFormProps> {
  /**
   *
   */
  constructor(props) {
    super(props);
    console.log("MyForm CTOR");
    console.log(props);

    this.state = { ...props }
  }

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
                  label="Department"
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
                  label={'Date'}
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
                  label="Requested By"
                  wrapperStyle={{ width: '50%', marginRight: '18px' }}
                  data={this.props.siteUsers}
                  dataItemKey="Email"
                  textField="Title"
                  validator={MyValidators.requestedByValidator}
                  component={MyFormComponents.FormComboBox}
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
