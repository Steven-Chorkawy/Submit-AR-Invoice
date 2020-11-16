import * as React from 'react';

// PNP Imports
import { sp } from "@pnp/sp";
import { Web } from "@pnp/sp/webs";
import "@pnp/sp/profiles";
import { PeoplePicker, PrincipalType } from "@pnp/spfx-controls-react/lib/PeoplePicker";

// Kendo Imports
import { FieldWrapper } from '@progress/kendo-react-form';
import {
    Input, MaskedTextBox, NumericTextBox,
    Checkbox, ColorPicker, Switch, RadioGroup,
    Slider, SliderLabel
} from '@progress/kendo-react-inputs';
import {
    DatePicker, TimePicker, DateTimePicker,
    DateRangePicker, DateInput
} from '@progress/kendo-react-dateinputs';
import { Label, Error, Hint, FloatingLabel } from '@progress/kendo-react-labels';
import { Upload } from '@progress/kendo-react-upload';
import { DropDownList, AutoComplete, MultiSelect, ComboBox } from '@progress/kendo-react-dropdowns';

// Office UI Imports
import { Persona, PersonaSize } from 'office-ui-fabric-react/lib/Persona';
import { Shimmer, ShimmerElementsGroup, ShimmerElementType } from 'office-ui-fabric-react/lib/Shimmer';

// TODO : Make a Persona class that takes user, user email, or user id as a property. 

export class PersonaComponent extends React.Component<any, any> {

}
