import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Form, Field, FieldArray, FieldArrayRenderProps, FormElement } from '@progress/kendo-react-form';
import { Error } from '@progress/kendo-react-labels';
import { Input, MaskedTextBox, NumericTextBox, Switch } from '@progress/kendo-react-inputs';
import { Grid, GridColumn, GridToolbar } from '@progress/kendo-react-grid';


const nameCell = (props) => {
  return (
    <td>
      <Field
        component={Input}
        name={`GLAccounts[${props.dataIndex}].${props.field}`}
      />
    </td>
  );
};

const glCodeCell = (props) => {
  return (
    <td>
      <Field
        mask="000-00-000-00000-0000"
        component={MaskedTextBox}
        name={`GLAccounts[${props.dataIndex}].${props.field}`}
      />
    </td>
  );
};

const ammountCell = (props) => {
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

const hstTaxableCell = (props) => {
  return (
    <td>
      <Field
        component={Switch}
        name={`GLAccounts[${props.dataIndex}].${props.field}`}
        value={false}
      />
    </td>
  );
}

const hstCell = (props) => {
  return (
    <td>
      <Field
        format="c2"
        component={NumericTextBox}
        name="HST"
        readonly={true}
        disabled={true}
        value={(props.dataItem.HSTTaxable == true) ? props.dataItem.ammount * 0.13 : 0}
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
          glCode: '',
          ammount: '',
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
    <div>
      {
        visited && validationMessage &&
        (<Error>{validationMessage}</Error>)
      }
      <Grid
        data={fieldArrayRenderProps.value}
        // resizable={true}
      >
        <GridToolbar>
          <button title="Add new" className="k-button k-primary" onClick={onAdd} >Add new Account</button>
        </GridToolbar>

        <GridColumn
          field="glCode"
          title="G/L Account #"
          cell={glCodeCell}
          width="200px"
        />

        <GridColumn field="ammount" title="Ammount" cell={ammountCell} />

        <GridColumn
          field="HSTTaxable"
          title="HST"
          cell={hstTaxableCell}
          width="100px"
        />

        <GridColumn
          field="HST"
          title="HST Ammount"
          cell={hstCell}
        />

        <GridColumn cell={commandCell(onRemove)} width="100px" />
      </Grid>
    </div>
  );
};
