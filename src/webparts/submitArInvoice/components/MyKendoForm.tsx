import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Form, Field, FormElement, FieldWrapper } from '@progress/kendo-react-form';
import { Error } from '@progress/kendo-react-labels';
import { Input } from '@progress/kendo-react-inputs'

import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import * as MyFormComponents from './MyFormComponents';


export class MyForm extends React.Component {
  /**
   *
   */
  constructor(props) {
    super(props);

  }

  handleSubmit = (dataItem) => {
    console.log(dataItem);
    alert("Form Submit!");
  }

  render() {
    return (
      <div style={{padding:'5px'}}>
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
                  component={MyFormComponents.FormDropDownList}
                />

                <Field
                  id={'Date'}
                  name={'Date'}
                  label={'Date'}
                  component={MyFormComponents.FormDatePicker}
                  defaultValue={new Date()}
                  // validator={arrivalDateValidator}
                  wrapperStyle={{ width: '50%'}}
                />
              </div>
            </FormElement>
          )} />
      </div>
    )
  }

}
