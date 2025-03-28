import { IInputs, IOutputs } from "./generated/ManifestTypes"
import * as React from 'react'
import * as ReactDom from 'react-dom'
import { DropdownMenuItemType, IDropdownOption } from '@fluentui/react/lib/Dropdown'
import { SearchableDropdown } from './SearchableDropdown'

export class LookupAsOptionSet implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    
    private _context: ComponentFramework.Context<IInputs>;
    private container: HTMLDivElement;
    private notifyOutputChanged: () => void;
    private entityName: string;
    private entityIdFieldName: string;
    private entityNameFieldName: string;
    private entityDisplayName: string;
    private viewId: string;
    private availableOptions: IDropdownOption[];
    private currentValue?: ComponentFramework.LookupValue[];
    private newlyCreatedId: string|null;
    private parentId: string|null;

    constructor() {
        // Empty
    }

    /**
     * Renders a fallback UI when the lookup entity name is missing.
     */
    private renderFallback(): void {
        const fallbackElement = React.createElement(
            "div", 
            { 
                className: "fallback-message",
            }, 
            "---"
        );
        ReactDom.render(fallbackElement, this.container);
    }    

    /**
     * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
     * Data-set values are not initialized here, use updateView.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
     * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
     * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
     * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
     */
    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary,
        container: HTMLDivElement
    ): void {
        try{
            this._context = context;
            this.container = container
            this.notifyOutputChanged = notifyOutputChanged
    
            this.entityName = context.parameters.lookup.getTargetEntityType()
            this.viewId = context.parameters.lookup.getViewId();
    
            if (!this.entityName) {
                console.warn("Lookup entity name is missing, displaying fallbak UI.")
                this.renderFallback();
                return;
            }
    
            context.utils.getEntityMetadata(this.entityName).then(metadata => {
                            
                this.entityIdFieldName = metadata.PrimaryIdAttribute
                this.entityNameFieldName = metadata.PrimaryNameAttribute
                this.entityDisplayName = metadata.DisplayName;
    
                return this.retrieveRecords();
            }).catch(error => {
                console.error("Metadata fetch error:", error);
                this.renderFallback();
            });
        } catch (error) {
            console.error("Init error:", error);
            this.renderFallback();
        }
    }

    private async retrieveRecords(){
        let filter = "";
        if(this.viewId){
            filter = "?$top=1&$select=fetchxml,returnedtypecode&$filter=savedqueryid eq " + this.viewId;
        }
        else{
            filter = "?$top=1&$select=fetchxml,returnedtypecode&$filter=returnedtypecode eq '" + this.entityName + "' and querytype eq 64";
        }

        try {
            // Retrieve FetchXML query
            const result = await this._context.webAPI.retrieveMultipleRecords('savedquery', filter);
            const view = result.entities[0];
            let xml = view.fetchxml;

            if (this._context.parameters.dependantLookup && this._context.parameters.dependantLookup.raw && this._context.parameters.dependantLookup.raw.length > 0){
                const dependentId = this._context.parameters.dependantLookup.raw[0].id;
                const attributeName = this._context.parameters.dependantLookup.attributes?.LogicalName ?? "";

                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xml, "text/xml");

                const entityNode = xmlDoc.getElementsByTagName("entity")[0];
                const filterNodes = entityNode.getElementsByTagName("filter");
                let filterNode;
                if(filterNodes.length == 0){
                    filterNode = xmlDoc.createElement("filter");
                    entityNode.appendChild(filterNode);
                }
                else{
                    filterNode = filterNodes[0];
                }

                // adding condition
                const conditionNode = xmlDoc.createElement("condition");
                conditionNode.setAttribute("attribute", attributeName);
                conditionNode.setAttribute("operator", "eq");
                conditionNode.setAttribute("value", dependentId);
                filterNode.appendChild(conditionNode);

                xml = xmlDoc.documentElement.outerHTML;
            }

            // Ensure localized attribute name is included
            const mask = this._context.parameters.attributemask.raw;
            const localizedEntityFieldName = mask ? mask.replace('{lcid}', this._context.userSettings.languageId.toString()) : "";

            if (localizedEntityFieldName) {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xml, "text/xml");
                const entityNode = xmlDoc.getElementsByTagName("entity")[0];

                // Check if attribute is already included in FetchXML
                const existingAttribute = Array.from(entityNode.getElementsByTagName("attribute"));
                const attributeExists = existingAttribute.some(attr => attr.getAttribute("name") === localizedEntityFieldName);

                if (!attributeExists) {
                    const attributeNode = xmlDoc.createElement("attribute");
                    attributeNode.setAttribute("name", localizedEntityFieldName);
                    entityNode.appendChild(attributeNode);
                }

                xml = xmlDoc.documentElement.outerHTML;
            }

            // Retrieve records using FetchXML
            const recordResult = await this._context.webAPI.retrieveMultipleRecords(view.returnedtypecode, '?fetchXml=' + xml);

            this.availableOptions = recordResult.entities.map(r => {
                let localizedEntityFieldName = "";
                const mask = this._context.parameters.attributemask.raw;

                if(mask){
                    localizedEntityFieldName = mask.replace('{lcid}', this._context.userSettings.languageId.toString());
                }

                return {
                    key: r[this.entityIdFieldName],
                    text: (r[localizedEntityFieldName] ? r[localizedEntityFieldName] : r[this.entityNameFieldName]) ?? 'Display Name is not available'
                };
            });

            this.renderControl(this._context);
        } catch (error) {
            console.error("Error retrieving FetchXML records: ", error);
            throw error;
        }
    }

    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     */
    public updateView(context: ComponentFramework.Context<IInputs>): void {
        try {
            if(context.updatedProperties.includes("dependantLookup")){
                const newParentId = context.parameters.dependantLookup.raw.length > 0 ? context.parameters.dependantLookup.raw[0].id : null;
                if(newParentId !== this.parentId){
                    this.parentId = newParentId;
                    this.currentValue = undefined;
                    this.notifyOutputChanged();
                    this.retrieveRecords().catch(error => {
                        console.error(error);
                    });
                }
            }
            else if(context.updatedProperties.includes("lookup")){
                this.renderControl(context);
            }
        } catch (error) {
            console.error("UpdateView error:", error);
            this.renderFallback();
        }
    }

    private renderControl(context: ComponentFramework.Context<IInputs>) {
        let recordId = context.parameters.lookup.raw != null && context.parameters.lookup.raw.length > 0 
        ? context.parameters.lookup.raw[0].id 
        : '---'

        if(this.newlyCreatedId){
            recordId = this.newlyCreatedId;
            this.newlyCreatedId = null;
        }

        if(context.parameters.sortByName.raw === "1"){
            this.availableOptions = this.availableOptions.sort((n1,n2) => {
                if (n1.text.toLowerCase() > n2.text.toLowerCase()) {
                    return 1;
                }
            
                if (n1.text.toLowerCase() < n2.text.toLowerCase()) {
                    return -1;
                }
            
                return 0;
            })
        }

        const searchOptions = this._context.parameters.addSearch.raw === "1" ? [ 
            { key: 'FilterHeader', text: '-', itemType: DropdownMenuItemType.Header, data:{label: this._context.resources.getString("searchPlaceHolder")} },
            { key: 'divider_filterHeader', text: '-', itemType: DropdownMenuItemType.Divider }
        ] : [];

        const options = [...searchOptions,{key: '---', text:'---'},...this.availableOptions];

        const recordSelector = React.createElement("div", { className: "custom-dropdown" },
            React.createElement(SearchableDropdown, {
                selectedKey: recordId,
                options: options,
                isDisabled: context.mode.isControlDisabled,
                onChange: (event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption, index?: number) => {
                    if (typeof option === 'undefined' || option.key === '---') {
                        this.currentValue = undefined;
                        this.notifyOutputChanged();
                    } else {
                        option.selected = true;
                        this.currentValue = [{
                            id: (option.key as string),
                            name: option.text,
                            entityType: this.entityName
                        }];
                        this.notifyOutputChanged();
                    }
                }
            })
        );

        ReactDom.render(recordSelector, this.container);
    }

    /**
     * It is called by the framework prior to a control receiving new data.
     * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as "bound" or "output"
     */
    public getOutputs(): IOutputs {
        return {
            lookup: this.currentValue
        }
    }

    /**
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. cancelling any pending remote calls, removing listeners, etc.
     */
    public destroy(): void {
        ReactDom.unmountComponentAtNode(this.container)
    }
}
