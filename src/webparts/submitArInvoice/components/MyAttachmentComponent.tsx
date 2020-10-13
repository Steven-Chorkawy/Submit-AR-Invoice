import * as React from 'react';
import { sp } from "@pnp/sp";


import { Card, CardTitle, CardSubtitle, CardBody, CardActions } from '@progress/kendo-react-layout';
import { Field } from '@progress/kendo-react-form';


import * as MyFormComponents from './MyFormComponents';
import { MyLists } from './enums/MyLists.js';
import { FieldUserSelectionMode } from '@pnp/sp/fields';


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

    /**
     * Upload a document as soon as it has been added to the upload widget.
     * @param e Upload widgets event object.
     */
    private _onAdd = (e) => {
        // affectedFiles are the files that have just been added. 
        // Loop through these to upload each one to SharePoint.
        for (let index = 0; index < e.affectedFiles.length; index++) {
            const element = e.affectedFiles[index];
            // Upload the document to the Related Invoice Attachments Document Library. 
            sp.web.getFolderByServerRelativeUrl(`${this.props.context.pageContext.web.serverRelativeUrl}/${MyLists["Related Invoice Attachments"]}`)
                .files
                .add(element.name, element.getRawFile(), true)
                .then(fileRes => {
                    // After the document has been uploaded, we can get it's metadata like so...
                    fileRes.file.getItem().then(item => {
                        const itemProxy: any = Object.assign({}, item);
                        // Update the metadata of the document that has just been uploaded to record which invoice request it belongs to & give it a title that can be used later. 
                        sp.web.lists.getByTitle(MyLists["Related Invoice Attachments"])
                            .items.getById(itemProxy.ID)
                            .update({ AR_x0020_Invoice_x0020_RequestId: this.props.productInEdit.Id, Title: element.name })
                            .then(rAttachmentRes => {
                                // This gets the requests existing related attachments.
                                // This needs to be done so we can see a list of all the realted attachments as a column. 
                                let currentRAttachmentIds = this.props.productInEdit.RelatedAttachments
                                    .filter(fromRelatedAttachments => fromRelatedAttachments.hasOwnProperty('Id'))
                                    .map(fromRelatedAttachmentsMap => fromRelatedAttachmentsMap.Id);
                                // After we've added all the existing documents we can append this newest document.
                                currentRAttachmentIds.push(itemProxy.ID);
                                // Update the invoice request with a list of all it's related documents. 
                                sp.web.lists.getByTitle(MyLists["AR Invoice Requests"])
                                    .items.getById(this.props.productInEdit.Id)
                                    .update({
                                        RelatedAttachmentsId: {
                                            results: currentRAttachmentIds
                                        }
                                    });
                            });
                    })
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
                        //listItemUI={this.MyItemRender}
                        myOnAdd={this._onAdd}
                        myOnRemove={this._onRemove}
                    />
                </CardBody>
            </Card>
        );
    }
}