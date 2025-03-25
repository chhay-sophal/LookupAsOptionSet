import * as React from 'react';
import { Dropdown, IDropdownOption, IDropdownProps, IDropdownStyleProps, IDropdownStyles } from '@fluentui/react/lib/Dropdown';
import { Icon } from '@fluentui/react/lib/Icon';
import { SearchBox } from '@fluentui/react/lib/SearchBox';
import { DefaultButton } from '@fluentui/react/lib/Button';
import { Callout, DirectionalHint } from '@fluentui/react/lib/Callout';

export const SearchableDropdown: React.FunctionComponent<IDropdownProps> = props => {
    const [searchText, setSearchText] = React.useState<string>('');
    const [isCalloutVisible, setIsCalloutVisible] = React.useState<boolean>(false);
    const [calloutDirection, setCalloutDirection] = React.useState<DirectionalHint>(DirectionalHint.bottomLeftEdge);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const updatePosition = () => {
            if (dropdownRef.current) {
                const rect = dropdownRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                const spaceAbove = rect.top;

                setCalloutDirection(spaceBelow > 300 ? DirectionalHint.bottomLeftEdge : DirectionalHint.topLeftEdge);
            }
        };

        if (isCalloutVisible) {
            updatePosition();
            window.addEventListener('scroll', updatePosition);
            window.addEventListener('resize', updatePosition);
        }

        return () => {
            window.removeEventListener('scroll', updatePosition);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isCalloutVisible]);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsCalloutVisible(false);
            }
        };

        if (isCalloutVisible) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isCalloutVisible]);

    const filteredOptions = props.options.filter(option =>
        option.text.toLowerCase().includes(searchText.toLowerCase()) &&
        !["divider", "new", "FilterHeader", "mru", "favorite"].includes(option.key?.toString())
    );

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            <Dropdown
                {...props}
                styles={DropdownStyle}
                selectedKey={props.selectedKey}
                onRenderCaretDown={() => (
                    <Icon iconName="ChevronDown" />
                )}
                onClick={() => setIsCalloutVisible(!isCalloutVisible)}
                onChange={(event, option) => {
                    if (option) {
                        props.onChange?.(event, option);
                        setIsCalloutVisible(false);
                    }
                }}
            />
            {isCalloutVisible && (
                <Callout
                    target={dropdownRef.current}
                    isBeakVisible={false}
                    directionalHint={calloutDirection}
                    onDismiss={() => setIsCalloutVisible(false)}
                    setInitialFocus
                    styles={{ calloutMain: { padding: 0, minWidth: 200 } }}
                >
                    {/* Search Box (Fixed Top) */}
                    <div style={searchContainerStyle}>
                        <SearchBox
                            placeholder="Search..."
                            value={searchText}
                            onChange={(_, newValue) => setSearchText(newValue || '')}
                        />
                    </div>

                    {/* Options List (Scrollable Middle) */}
                    <div style={optionsContainerStyle}>
                        {filteredOptions.map(option => (
                            <div 
                                key={option.key} 
                                style={optionContainerStyle} 
                                onClick={(event: React.MouseEvent<HTMLDivElement>) => props.onChange?.(event as unknown as React.FormEvent<HTMLDivElement>, option)}
                            >
                                <div style={checkmarkContainerStyle}>
                                    {option.key === props.selectedKey && <Icon iconName="CheckMark" style={checkmarkStyle} />}
                                </div>
                                <span>{option.text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Add New Button (Fixed Bottom) */}
                    <div 
                        style={addButtonContainerStyle}
                        onClick={(event: React.MouseEvent<HTMLDivElement>) => props.onChange?.(event as unknown as React.FormEvent<HTMLDivElement>, { key: 'new', text: 'Add New' })}
                    >
                        <DefaultButton text="+ Add new" onClick={() => alert('Add new clicked!')} />
                    </div>
                </Callout>
            )}
        </div>
    );
};

// Styling for the dropdown
const searchContainerStyle: React.CSSProperties = {
    padding: '8px',
    borderBottom: '1px solid #ccc',
    backgroundColor: 'white',
    position: 'sticky',
    top: 0,
    zIndex: 10
};

const optionsContainerStyle: React.CSSProperties = {
    maxHeight: '200px',
    overflowY: 'auto',
    backgroundColor: 'white'
};

const addButtonContainerStyle: React.CSSProperties = {
    padding: '8px',
    borderTop: '1px solid #ccc',
    backgroundColor: 'white',
    position: 'sticky',
    bottom: 0,
    zIndex: 10
};

const optionContainerStyle = { display: 'flex', alignItems: 'center', padding: '8px', cursor: 'pointer' };
const checkmarkContainerStyle = { minWidth: '14px' };
const checkmarkStyle = { color: 'green', fontSize: '14px' };

export const DropdownStyle = (props: IDropdownStyleProps): Partial<IDropdownStyles> => ({
    root: { width: "100%" },
    title: { borderColor: "transparent", fontWeight: 600, ":hover": { borderColor: "rgb(96, 94, 92)", fontWeight: 400 } },
    caretDown: { color: "rgb(96, 94, 92)" },
    dropdown: { ":focus:after": { borderColor: "transparent" } },
    dropdownItems: {
        selectors: { "@media(min-width: 640px)": { maxHeight: 400 } }
    }
});
