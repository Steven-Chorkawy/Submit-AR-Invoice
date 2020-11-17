import * as React from 'react';

// PNP Imports
import { sp } from "@pnp/sp";
import "@pnp/sp/profiles";
import "@pnp/sp/webs";
import "@pnp/sp/profiles";
import "@pnp/sp/site-users";
import { ISiteUserInfo } from '@pnp/sp/site-users/types';

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

export interface IPersonaComponentProps {
    userId?: number;
    userEmail?: string;
    user?: ISiteUserInfo;
    userProfile?: any;
}

interface IPersonaComponentState {
    // This is not a ISiteUserInfo object.  
    userProfile: any;
}

export class PersonaComponent extends React.Component<IPersonaComponentProps, IPersonaComponentState> {
    constructor(props) {
        super(props);

        this.state = {
            userProfile: undefined
        };

        if(this.props.userProfile) {
            this.state = {
                userProfile: this.props.userProfile
            };
        }
        else if (this.props.user) {
            this.setUserProfileStateFromSiteUser(this.props.user);
        }
        else if (this.props.userId) {
            sp.web.siteUsers.getById(this.props.userId).get().then(res => {
                this.setUserProfileStateFromSiteUser(res);
            });
        }
        else if (this.props.userEmail) {
            sp.web.siteUsers.getByEmail(this.props.userEmail).get().then(res => {
                this.setUserProfileStateFromSiteUser(res);
            });
        }
    }

    /**
     * Get user profile properties from ISiteUserInfo LoginName.
     * @param user ISiteUserInfo 
     */
    private setUserProfileStateFromSiteUser = (user: ISiteUserInfo) => {
        sp.profiles.getPropertiesFor(user.LoginName).then(user => {
            // This converts UserProfileProperties from an array of key value pairs [{Key:'', Value: ''},{Key:'', Value: ''}]
            // Into an array of objects [{'Key': 'Value'}, {'Key: 'Value'}]
            let props = {};
            user.UserProfileProperties.map(p => {
                props[p.Key] = p.Value;
            });
            user['Props'] = { ...props };

            this.setState({
                userProfile: user
            });
        });
    }

    public render() {
        let user = this.state.userProfile;
        return (
            user ?
                <Persona
                    imageUrl={user.PictureUrl}
                    imageInitials={`${user.Props['FirstName'].charAt(0)} ${user.Props['LastName'].charAt(0)}`}
                    text={`${user.Props['FirstName']} ${user.Props['LastName']}`}
                    size={PersonaSize.size40}
                    secondaryText={user.Title}
                /> :
                <div style={{ display: 'flex' }}>
                    <ShimmerElementsGroup
                        shimmerElements={[
                            { type: ShimmerElementType.circle, height: 40 },
                            { type: ShimmerElementType.gap, width: 16, height: 40 },
                        ]}
                    />
                    <ShimmerElementsGroup
                        flexWrap
                        width="100%"
                        shimmerElements={[
                            { type: ShimmerElementType.line, width: '100%', height: 10, verticalAlign: 'bottom' },
                            { type: ShimmerElementType.line, width: '90%', height: 8 },
                            { type: ShimmerElementType.gap, width: '10%', height: 20 },
                        ]}
                    />
                </div>
        );
    }
}
