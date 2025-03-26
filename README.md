# LookupAsOptionSet Control

## Overview

The LookupAsOptionSet control is a custom PowerApps Component Framework (PCF) control that displays a Lookup column as an OptionSet list. This control allows users to select from a list of options, filter options based on another Lookup column, and create new records directly from the dropdown.

## Features

- **Display Lookup as OptionSet**: Converts a Lookup column into an OptionSet dropdown.
- **Filtering**: Allows filtering of options based on another Lookup column.
- **Custom Display Mask**: Allows customization of the column used for display.
- **Sorting**: Options can be sorted by display name or view order.
- **Record Creation**: Users can create new records directly from the dropdown if they have the appropriate privileges.
- **Search Bar**: An optional search bar can be added to the dropdown for filtering options.

## Properties

### Lookup Column

- **Name**: lookup
- **Display Name Key**: lookup_Display_Key
- **Description Key**: lookup_Desc_Key
- **Type**: Lookup.Simple
- **Usage**: bound
- **Required**: true

### Filtering Column

- **Name**: dependantLookup
- **Display Name Key**: dependantLookup_Display_Key
- **Description Key**: dependantLookup_Desc_Key
- **Type**: Lookup.Simple
- **Usage**: bound
- **Required**: false

### Display Mask

- **Name**: attributemask
- **Display Name Key**: attributemask_Display_Key
- **Description Key**: attributemask_Desc_Key
- **Type**: SingleLine.Text (logical name)
- **Usage**: input
- **Required**: false

### Sort by Display Name

- **Name**: sortByName
- **Display Name Key**: sortByName_Display_Key
- **Description Key**: sortByName_Desc_Key
- **Type**: Enum
- **Default Value**: 0
- **Usage**: input
- **Required**: true
- **Values**:
  - Yes (1)
  - No (0)

### Allow Record Creation

- **Name**: addNew
- **Display Name Key**: addNew_Display_Key
- **Description Key**: addNew_Desc_Key
- **Type**: Enum
- **Default Value**: 0
- **Usage**: input
- **Required**: true
- **Values**:
  - Yes (1)
  - No (0)

### Display Search Bar

- **Name**: addSearch
- **Display Name Key**: addSearch_Display_Key
- **Description Key**: addSearch_Desc_Key
- **Type**: Enum
- **Default Value**: 0
- **Usage**: input
- **Required**: true
- **Values**:
  - Yes (1)
  - No (0)

## Steps to Use

### Step 1: Import the Control

1. Open your CRM environment.
2. Navigate to **Settings > Solutions**.
3. Click on **Import** and select the solution file that contains the LookupAsOptionSet control (`LookupAsOptionSet_Solution\bin\Debug\LookupAsOptionSet_Solution.zip`).
4. Follow the prompts to complete the import process.

### Step 2: Add the Control to a Form

1. Navigate to **Settings > Customizations > Customize the System**.
2. In the **Entities** section, select the entity where you want to add the control.
3. Click on **Forms** and open the form where you want to add the control.
4. Select the field that you want to convert to an OptionSet.
5. In the field properties, click on **Controls**.
6. Click on **Add Control** and select **LookupAsOptionSet** from the list.
7. Configure the properties for the control:
   - **Lookup Column**: Select the Lookup column to be displayed as an OptionSet.
   - **Filtering Column**: (Optional) Select the Lookup column to use for filtering.
   - **Display Mask**: (Optional) Enter the display mask for the column.
   - **Sort by Display Name**: Choose whether to sort by display name or view order.
   - **Allow Record Creation**: Choose whether to allow users to create new records from the dropdown.
   - **Display Search Bar**: Choose whether to display a search bar on top of the dropdown.
8. Click on **OK** to save the control settings.
9. Save and publish the form.

### Step 3: Test the Control

1. Navigate to the entity where you added the control.
2. Open a record and verify that the Lookup field is displayed as an OptionSet.
3. Test the filtering, sorting, record creation, and search functionalities to ensure they work as expected.

## Example Configuration

Here is an example configuration for the LookupAsOptionSet control in the form editor:

- **Lookup Column**: PrimaryContactId
- **Filtering Column**: AccountId
- **Display Mask**: fullname
- **Sort by Display Name**: Yes
- **Allow Record Creation**: Yes
- **Display Search Bar**: Yes
