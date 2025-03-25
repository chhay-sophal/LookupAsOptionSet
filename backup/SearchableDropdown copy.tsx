import * as React from 'react';
import { Dropdown, DropdownMenuItemType, IDropdownOption, IDropdownProps, IDropdownStyleProps, IDropdownStyles } from '@fluentui/react/lib/Dropdown';
import { Icon } from '@fluentui/react/lib/Icon';
import { SearchBox } from '@fluentui/react/lib/SearchBox';
import { DirectionalHint } from '@fluentui/react/lib/Callout';

export const SearchableDropdown: React.FunctionComponent<IDropdownProps> = props => {
    const [searchText, setSearchText] = React.useState<string>('');

    return (
        <Dropdown
            {...props}
            styles={DropdownStyle}
            calloutProps={{ calloutMaxHeight: 300 }}
            onDismiss={() => setSearchText('')}
            selectedKey={props.selectedKey}
            onRenderContainer={(containerProps, defaultRender) => {
                if (!containerProps || !containerProps.options) return null;
                const filteredOptions: IDropdownOption[] = containerProps.options.filter((option: IDropdownOption) => 
                    option.key === 'FilterHeader' || 
                    option.key === 'new' ||
                    (!option.disabled && option.text.toLowerCase().includes(searchText.toLowerCase()))
                );
                return (
                    <div style={dropdownContainerStyle}>
                        {/* SearchBox */}
                        <div style={searchBoxContainerStyle}>
                            <SearchBox
                                onChange={(ev, newValue) => setSearchText(newValue ?? '')}
                                underlined={true}
                                placeholder="Search..."
                            />
                        </div>
                        
                        {/* Scrollable Options */}
                        <div style={optionsContainerStyle}>
                            {filteredOptions.map(option => option.key !== "FilterHeader" && option.key !== "new" && (
                                <button 
                                    key={option.key} 
                                    style={optionContainerStyle} 
                                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => props.onChange?.(event as unknown as React.FormEvent<HTMLDivElement>, option)}
                                >
                                    <div style={checkmarkContainerStyle}>
                                        {option.key === props.selectedKey && <Icon iconName="CheckMark" style={checkmarkStyle} />}
                                        {option.data?.icon && (
                                            <Icon iconName={option.data.icon} aria-hidden="true" title={option.data.icon} />
                                        )}
                                    </div>
                                    <span>{option.text}</span>
                                </button>                            
                            ))}
                        </div>

                        {/* Add New Option */}
                        <div style={addNewContainerStyle}>
                            {filteredOptions.find(option => option.key === "new") && (
                                <button 
                                    style={optionContainerStyle} 
                                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => props.onChange?.(event as unknown as React.FormEvent<HTMLDivElement>, { key: 'new', text: 'Add New' })}
                                >
                                    <Icon iconName="Add" style={{ marginRight: 8 }} />
                                    <span>Add New</span>
                                </button>                            
                            )}
                        </div>
                    </div>
                );
            }}
        />
    );
};

// Styles
const dropdownContainerStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', width: '100%', borderRadius: '4px' };
const searchBoxContainerStyle = { padding: '8px', borderBottom: '1px solid #ccc' };
const optionsContainerStyle: React.CSSProperties = { maxHeight: '200px', overflowY: 'auto', padding: '8px' };
const addNewContainerStyle = { padding: '8px', borderTop: '1px solid #ccc', cursor: 'pointer' };
const optionContainerStyle = { display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px' };
const checkmarkContainerStyle = { minWidth: '14px' };
const checkmarkStyle = { color: 'green', fontSize: '14px' };

export const DropdownStyle = (props: IDropdownStyleProps): Partial<IDropdownStyles> => ({
    root: { width: "100%" },
    title: {
        borderColor: "transparent",
        fontWeight: 600,
        ':hover': {
            borderColor: "rgb(96, 94, 92)",
            fontWeight: 400
        }
    },
    caretDown: { color: "rgb(96, 94, 92)" },
    dropdown: {
        ':focus:after': { borderColor: "transparent" }
    },
    dropdownItems: {
        selectors: {
            '@media(min-width: 640px)': { maxHeight: 400 }
        }
    }
});
