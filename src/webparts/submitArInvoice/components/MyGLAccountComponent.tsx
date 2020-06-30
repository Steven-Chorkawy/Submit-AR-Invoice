import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Form, Field, FieldArray, FieldArrayRenderProps, FormElement } from '@progress/kendo-react-form';
import { Error } from '@progress/kendo-react-labels';
import { Input, MaskedTextBox, NumericTextBox, Switch, Checkbox } from '@progress/kendo-react-inputs';
import { Grid, GridColumn, GridToolbar } from '@progress/kendo-react-grid';


import * as MyValidators from './validators.jsx'
import * as MyFormComponents from './MyFormComponents';
import { MyForm } from './MyKendoForm.js';

/**
   * Calculate HST this current row.
   *
   * @param props Grid properties.
   */
const CalculateHSTAmount = (props) => {
  return (props.dataItem.HSTTaxable == true) ? props.dataItem.Amount * 0.13 : 0
}


const glCodeCell = (props) => {
  return (
    <td>
      <Field
        mask="000-00-000-00000-0000"
        component={MyFormComponents.FormMaskedTextBox}
        validator={MyValidators.glCodeValidator}
        name={`GLAccounts[${props.dataIndex}].${props.field}`}
      />
    </td>
  );
};


/**
 * Amount before HST.
 * @param props Grid properties.
 */
const amountCell = (props) => {
  return (
    <td>
      <Field
        format="c2"
        component={NumericTextBox}
        name={`GLAccounts[${props.dataIndex}].${props.field}`}
      />
    </td>
  );
}


/**
 * Total Amount including HST.
 * Amount + HST Amount
 * @param props Grid properties.
 */
const totalInvoiceCell = (props) => {
  return (
    <td>
      <Field
        format="c2"
        component={NumericTextBox}
        name='TotalInvoice'
        readonly={true}
        disabled={true}
        value={
          (props.dataItem.Amount == null) ? 0 : CalculateHSTAmount(props) + props.dataItem.Amount
        }
      />
    </td>
  );
}


/**
 * Boolean, Does HST Apply?
 * @param props Grid Properties
 */
const hstTaxableCell = (props) => {
  return (
    <td>
      <Field
        component={Checkbox}
        name={`GLAccounts[${props.dataIndex}].${props.field}`}
      />
    </td>
  );
}


/**
 * HST Calculated from Amount.
 * HST = Amount * 0.13
 * EX: $1,000 * 0.13 = $130
 * @param props Grid Properties
 */
const hstCell = (props) => {
  return (
    <td>
      <Field
        format="c2"
        component={NumericTextBox}
        name="HST"
        readonly={true}
        disabled={true}
        value={CalculateHSTAmount(props)}
      />
    </td>
  );
}


const commandCell = (onRemove) => (props) => {
  const onClick = React.useCallback(
    (e) => {
      e.preventDefault();
      onRemove(props);
    },
    [onRemove]
  );
  return (
    <td>
      <button
        className="k-button k-grid-remove-command"
        onClick={onClick}
      >Remove</button>
    </td>
  );
};


export const MyGLAccountComponent = (fieldArrayRenderProps) => {
  const { validationMessage, visited } = fieldArrayRenderProps;

  const onAdd = React.useCallback(
    (e) => {
      e.preventDefault();
      fieldArrayRenderProps.onUnshift({
        value: {
          GLCode: '',
          Amount: '',
          HSTTaxable: false
        }
      });
    },
    [fieldArrayRenderProps.onUnshift]
  );

  const onRemove = React.useCallback(
    (cellProps) => fieldArrayRenderProps.onRemove({ index: cellProps.dataIndex }),
    [fieldArrayRenderProps.onRemove]
  );

  return (
    <div key={fieldArrayRenderProps.value}>
      <Grid
        data={fieldArrayRenderProps.value}
        resizable={true}
      >

        <GridToolbar>
          <button title="Add new" className="k-button k-primary" onClick={onAdd} >Add new Account</button>
        </GridToolbar>

        <GridColumn
          field="GLCode"
          title="G/L Account #"
          cell={glCodeCell}
          width="200px"
        />

        <GridColumn
          field="Amount"
          title="Amount"
          cell={amountCell}
        />

        <GridColumn
          field="HSTTaxable"
          title="HST"
          cell={hstTaxableCell}
          width="60px"
        />

        <GridColumn
          field="HST"
          title="HST Amount"
          cell={hstCell}
        />

        <GridColumn
          field="TotalInvoice"
          title="Total Invoice"
          cell={totalInvoiceCell}
        />

        <GridColumn cell={commandCell(onRemove)} width="95px" />
      </Grid>
    </div>
  );
};
