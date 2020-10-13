import * as React from 'react';
import { sp } from "@pnp/sp";


import { Card, CardTitle, CardSubtitle, CardBody, CardActions } from '@progress/kendo-react-layout';
import { Field } from '@progress/kendo-react-form';


import * as MyFormComponents from './MyFormComponents';
import { MyLists } from './enums/MyLists.js';


interface IMyAttachmentComponentProps {
    cardTitle: string;
    productInEdit: any;
    context: any;
    id: string;
    name?: string;
    documentLibrary: string;
}

class CustomListItemUI extends React.Component<any> {

    constructor(props) {
        super(props);
    }


    render() {
        debugger;
        const { files } = this.props;

        return (
            <ul>
                {
                    files.map(file =>
                        <li key={file.name}>
                            {file.name} <button onClick={this.props.onRemove}>x</button>
                        </li>
                    )
                }
            </ul>
        );
    }
}


export class MyAttachmentComponent extends React.Component<IMyAttachmentComponentProps, any> {

    constructor(props) {
        super(props);
    }

    private _onAdd = (e) => {
        debugger;
        for (let index = 0; index < e.affectedFiles.length; index++) {
            const element = e.affectedFiles[index];
            sp.web.getFolderByServerRelativeUrl('/sites/FinanceTest/ARTest/RelatedInvoiceAttachments/').files
                .add(element.name, element.getRawFile(), true)
                .then(fileRes => {
                    fileRes.file.getItem()
                        .then(item => {
                            debugger;
                        });
                });
        }
    }

    private _onRemove = (e) => {
        debugger;
    }

    private MyItemRender = (props) => <CustomListItemUI {...props} />
    public render() {
        return (
            <Card style={{ width: 400 }}>
                <CardBody>
                    <CardTitle>
                        <b>{this.props.cardTitle}</b>
                    </CardTitle>
                    <hr />
                    <Field
                        id={this.props.id}
                        name={this.props.name ? this.props.name : this.props.id}
                        batch={false}
                        multiple={true}
                        context={this.props.context}
                        documentLibrary={this.props.documentLibrary}
                        component={MyFormComponents.FormAutoUpload}
                        listItemUI={this.MyItemRender}
                        MyOnAdd={this._onAdd}
                        MyOnRemove={this._onRemove}
                    />
                </CardBody>
            </Card>
        );
    }
}