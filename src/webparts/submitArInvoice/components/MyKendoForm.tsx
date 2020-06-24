import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Form, Field, FormElement, FieldWrapper } from '@progress/kendo-react-form';
import { Error } from '@progress/kendo-react-labels';
import { Input } from '@progress/kendo-react-inputs'

import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import { FormInput } from './MyFormComponents';


export class MyForm extends React.Component {
  /**
   *
   */
  constructor(props) {
    super(props);

  }

  render() {
    return (
      <div>
        <h1>This is my form.</h1>
        <Form
          onSubmit={
            () => {
              alert("Form Submit!");
            }
          }

          render={(formRenderProps) => (
            <FormElement>
              <h2>Hello world</h2>
            </FormElement>
          )} />
      </div>
    )
  }

}
