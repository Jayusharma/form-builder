/**
 * GridFormBuilder Component
 * 
 * A professional form builder interface that allows users to create and edit forms using a grid-based layout system.
 * Features include:
 * - Drag-and-drop form field positioning
 * - Real-time form preview
 * - Rich text editing
 * - Multiple field types (text, paragraph, multiple choice, etc.)
 * - Responsive grid layout
 * - Form styling options
 * 
 * @component
 */

'use client';

import * as React from 'react';
import { useState, useCallback, useEffect } from 'react';
// Remove dnd-kit imports
// import { ... } from '@dnd-kit/core';
// import { ... } from '@dnd-kit/sortable';
// import { CSS } from '@dnd-kit/utilities';

// Import react-grid-layout components and styles
import GridLayout, { Layout } from 'react-grid-layout';
import '/node_modules/react-grid-layout/css/styles.css';
import '/node_modules/react-resizable/css/styles.css';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  FormField, 
  FormFieldType, 
  FormSchema, 
  FormFieldSchema,
  FormStyle
} from '@/lib/schemas/form';
import { 
  TextIcon, 
  ListIcon, 
  CheckSquareIcon, 
  RadioIcon, 
  ChevronDownIcon,
  GripVertical,
  PlusIcon,
  Trash2Icon,
  MoveIcon,
  SendIcon,
  ImageIcon,
  FileTextIcon,
  MinusIcon,
  XIcon,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useRouter, useSearchParams } from 'next/navigation';
import { FormPreview } from '@/components/forms/FormPreview';
import { RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup } from "@/components/ui/radio-group";
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { HexColorPicker } from 'react-colorful';

/**
 * Grid system configuration constants
 * Defines the layout parameters for the form builder grid
 */
const GRID_CONFIG = {
  columns: 12,          // 12-column grid system
  rowHeight: 40,        // Height of each grid row in pixels
  gap: 8,              // Gap between grid items
  minFieldWidth: 4,     // Minimum width of a field in grid columns
  maxFieldWidth: 12,    // Maximum width of a field in grid columns
  minFieldHeight: 1,    // Minimum height of a field in grid rows
  defaultFieldHeight: 1,// Default height of a field in grid rows
  containerPadding: [8, 8], // Padding around the grid container
  margin: [8, 8],       // Margin between grid items
} as const;

/**
 * Default height mapping for different field types
 * Defines the initial height of each field type in grid rows
 */
const fieldTypeDefaultHeight: Record<FormFieldType, number> = {
  TEXT: 1,
  PARAGRAPH: 1,
  RICH_TEXT: 1,
  MULTIPLE_CHOICE: 1,
  CHECKBOX: 1,
  DROPDOWN: 1,
  IMAGE_UPLOAD: 1,
  SUBMIT: 1,
};

/**
 * GridFormField Interface
 * Extends the base FormField type with grid-specific properties
 * Used for managing form fields within the grid layout system
 */
interface GridFormField {
  id: string;           // Unique identifier for the field
  type: FormFieldType;  // Type of form field (TEXT, PARAGRAPH, etc.)
  question: string;     // Field question/label
  required: boolean;    // Whether the field is required
  options?: string[];   // Options for choice-based fields
  description: string | null; // Field description/help text
  // Grid layout properties
  i: string;           // react-grid-layout item ID
  x: number;           // Grid x position
  y: number;           // Grid y position
  w: number;           // Grid width
  h: number;           // Grid height
  minW?: number;       // Minimum width
  maxW?: number;       // Maximum width
  minH?: number;       // Minimum height
  maxH?: number;       // Maximum height
  static?: boolean;    // Whether the field is static (not draggable)
  isDraggable?: boolean; // Whether the field can be dragged
  isResizable?: boolean; // Whether the field can be resized
}

/**
 * Field Type Configuration
 * Defines the available field types and their default properties
 */
const fieldTypes: Array<{
  type: FormFieldType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultWidth: number;
}> = [
  { type: 'TEXT', label: 'Short Answer', icon: TextIcon, defaultWidth: 6 },
  { type: 'PARAGRAPH', label: 'Paragraph', icon: TextIcon, defaultWidth: 12 },
  { type: 'RICH_TEXT', label: 'Rich Text', icon: FileTextIcon, defaultWidth: 12 },
  { type: 'MULTIPLE_CHOICE', label: 'Multiple Choice', icon: RadioIcon, defaultWidth: 6 },
  { type: 'CHECKBOX', label: 'Checkboxes', icon: CheckSquareIcon, defaultWidth: 6 },
  { type: 'DROPDOWN', label: 'Dropdown', icon: ChevronDownIcon, defaultWidth: 6 },
  { type: 'IMAGE_UPLOAD', label: 'Image Upload', icon: ImageIcon, defaultWidth: 6 },
];

// Add a helper function to ensure valid option values
const ensureValidOption = (option: string, index: number) => {
  return option.trim() || `Option ${index + 1}`;
};

/**
 * OptionManager Component
 * Manages options for choice-based fields (multiple choice, checkbox, dropdown)
 * 
 * @param {Object} props - Component props
 * @param {string[]} props.options - Array of option strings
 * @param {Function} props.onUpdate - Callback when options are updated
 * @param {FormFieldType} props.fieldType - Type of field being managed
 */
function OptionManager({
  options,
  onUpdate,
  fieldType,
  dict,
}: {
  options: string[],
  onUpdate: (options: string[]) => void,
  fieldType: FormFieldType,
  dict: {
    addOption: string;
    removeOption: string;
  }
}) {
  const handleAddOption = () => {
    onUpdate([...options, `Option ${options.length + 1}`]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 1) return; // Keep at least 2 options
    onUpdate(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    onUpdate(newOptions);
  };

  return (
    <div className="space-y-2">
      {fieldType === 'MULTIPLE_CHOICE' ? (
        <RadioGroup disabled value="">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Input
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="flex-1"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveOption(index)}
                disabled={options.length <= 1}
                className="h-8 w-8 text-destructive hover:text-destructive/90"
                title={dict.removeOption}
              >
                <MinusIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </RadioGroup>
      ) : (
        options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2">
              {fieldType === 'CHECKBOX' && (
                <Checkbox id={`option-${index}`} disabled />
              )}
              <Input
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className="flex-1"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveOption(index)}
              disabled={options.length <= 1}
              className="h-8 w-8 text-destructive hover:text-destructive/90"
              title={dict.removeOption}
            >
              <MinusIcon className="h-4 w-4" />
            </Button>
          </div>
        ))
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={handleAddOption}
        className="w-full mt-2"
      >
        <PlusIcon className="h-4 w-4 mr-2" />
        {dict.addOption}
      </Button>
    </div>
  );
}

// Update the gridItemStyle constant
const gridItemStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  overflow: 'hidden',
  backgroundColor: 'var(--card)',
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  position: 'relative',
  width: '100%',
  height: '100%',
};

// Add these styles at the top of the file after the imports
const styles = `
  .react-grid-layout {
    position: relative;
    transition: height 200ms ease;
    width: 100% !important;
  }
  .react-grid-item {
    transition: all 200ms ease;
    transition-property: left, top, width, height;
    position: absolute;
    box-sizing: border-box;
  }
  .react-grid-item.react-grid-placeholder {
    background: black;
    opacity: 0.2;
    transition-duration: 100ms;
    z-index: 2;
    border-radius: var(--radius);
  }
  .react-grid-item.react-draggable-dragging {
    transition: none;
    z-index: 3;
  }
  .react-grid-item.react-grid-item.resizing {
    z-index: 1;
    will-change: width, height;
  }
  .react-grid-item > .react-resizable-handle {
    position: absolute;
    width: 20px;
    height: 20px;
    bottom: 0;
    right: 0;
    cursor: se-resize;
  }
  .react-grid-item > .react-resizable-handle::after {
    content: "";
    position: absolute;
    right: 3px;
    bottom: 3px;
    width: 5px;
    height: 5px;
    border-right: 2px solid var(--border);
    border-bottom: 2px solid var(--border);
  }
`;

/**
 * GridItem Component
 * Renders a single form field within the grid layout
 * 
 * @param {Object} props - Component props
 * @param {GridFormField} props.field - Field data
 * @param {Function} props.onUpdate - Callback when field is updated
 * @param {Function} props.onDelete - Callback when field is deleted
 */
function GridItem({ 
  field, 
  onUpdate, 
  onDelete,
  dict,
}: {
  field: GridFormField;
  onUpdate: (field: GridFormField) => void;
  onDelete: (id: string) => void;
  dict: FieldDetailsModalProps['dict'];
}) {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  return (
    <Card className="h-[40px] flex flex-col overflow-hidden" style={{
      ...gridItemStyle,
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      backgroundColor: 'var(--card)',
    }}>
      <CardHeader className="p-0 h-full flex ">
        <div className="flex items-center justify-center gap-1.5 h-full px-2">
          {/* Drag handle - always show for all fields */}
          <Button
            variant="ghost"
            size="icon"
            className="drag-handle h-6 w-6 cursor-grab active:cursor-grabbing shrink-0 hover:bg-transparent"
            type="button"
          >
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/70" />
          </Button>
          
          {/* Question input */}
          <Input
            value={field.question}
            onChange={(e) => onUpdate({ ...field, question: e.target.value })}
            placeholder="Question"
            className="h-6 text-sm font-medium bg-transparent border-none focus-visible:ring-transparent flex-1 px-1 text-center"
          />

          {/* Action buttons - show for all fields except delete for submit */}
          <div className="flex items-center  gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDetailsModalOpen(true)}
              className="h-6 w-6 text-muted-foreground/70 hover:text-foreground hover:bg-transparent"
              type="button"
            >
              <FileTextIcon className="h-3.5 w-3.5" />
            </Button>
            {field.type !== 'SUBMIT' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(field.id)}
                className="h-6 w-6 text-destructive/70 hover:text-destructive hover:bg-transparent"
                type="button"
              >
                <Trash2Icon className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Field Details Modal */}
      <FieldDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        fieldType={field.type}
        fieldData={field}
        onUpdateFieldData={(data) => {
          onUpdate({
            ...field,
            ...data,
            id: field.id,
            i: field.i,
            type: field.type,
            x: field.x,
            y: field.y,
            w: field.w,
            h: field.h,
          });
        }}
        onSaveFieldDetails={(updatedData) => {
          onUpdate({
            ...field,
            ...updatedData,
            id: field.id,
            i: field.i,
            type: field.type,
            x: field.x,
            y: field.y,
            w: field.w,
            h: field.h,
          });
          setIsDetailsModalOpen(false);
        }}
        initialFieldData={field}
        dict={dict}
      />
    </Card>
  );
}

// Add a helper function to ensure valid field type
const ensureValidFieldType = (type: string | undefined): FormFieldType => {
  const validTypes: FormFieldType[] = ['TEXT', 'PARAGRAPH', 'MULTIPLE_CHOICE', 'CHECKBOX', 'DROPDOWN', 'SUBMIT', 'IMAGE_UPLOAD', 'RICH_TEXT'];
  return validTypes.includes(type as FormFieldType) ? (type as FormFieldType) : 'TEXT';
};

// Define HeaderFooterConfig interface
interface HeaderFooterConfig {
  logo?: string;
  text?: string;
  enabled: boolean;
}

// Update HeaderFooterConfigDict interface
interface HeaderFooterConfigDict {
  uploadLogo: string;
  changeLogo: string;
  uploading: string;
  maxChars: string;
  text: string;
  logo: string;
  enable: string;
  logoUploadError: {
    invalidType: string;
    tooLarge: string;
    uploadFailed: string;
  };
  logoUploadSuccess: string;
}

// Update FieldDetailsModalProps interface
interface FieldDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldType: FormFieldType | null;
  fieldData: Partial<GridFormField>;
  onUpdateFieldData: (data: Partial<GridFormField>) => void;
  onSaveFieldDetails: (data: Partial<GridFormField>) => void;
  initialFieldData?: GridFormField;
  dict: {
    editField: string;
    addNewField: string;
    question: string;
    enterQuestion: string;
    required: string;
    content: string;
    enterContent: string;
    options: string;
    addOption: string;
    removeOption: string;
    description: string;
    enterDesc: string;
    save: string;
    cancel: string;
  };
}

// Update HeaderFooterModalProps interface
interface HeaderFooterModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'header' | 'footer';
  config: HeaderFooterConfig;
  onChange: (config: HeaderFooterConfig) => void;
  dict: {
    title: string;
    description: string;
    uploadLogo: string;
    changeLogo: string;
    uploading: string;
    maxChars: string;
    text: string;
    logo: string;
    enable: string;
    logoUploadError: {
      invalidType: string;
      tooLarge: string;
      uploadFailed: string;
    };
    logoUploadSuccess: string;
    close: string;
  };
}

// Update FieldDetailsModal component to use the interface
function FieldDetailsModal({
  isOpen,
  onClose,
  fieldType,
  fieldData,
  onUpdateFieldData,
  onSaveFieldDetails,
  initialFieldData,
  dict,
}: FieldDetailsModalProps) {
  // Determine the actual field type we are working with (either new or existing)
  const currentFieldType = fieldType || initialFieldData?.type || null;

  // Find the field type configuration based on the current field type
  const fieldTypeConfig = fieldTypes.find(ft => ft.type === currentFieldType);

  // Use initialFieldData if provided, otherwise use the fieldData from state (for new fields)
  const currentFieldData = initialFieldData || fieldData;

  // Handlers for updating data within the modal
  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateFieldData({ ...currentFieldData, question: e.target.value });
  };

  const handleRequiredChange = (checked: boolean) => {
    onUpdateFieldData({ ...currentFieldData, required: checked });
  };

  const handleDescriptionChange = (content: string) => {
    onUpdateFieldData({ ...currentFieldData, description: content });
  };

  const handleOptionsChange = (options: string[]) => {
    onUpdateFieldData({ ...currentFieldData, options: options });
  };

  if (!currentFieldType) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{initialFieldData ? dict.editField : dict.addNewField}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 flex-1 overflow-y-auto">
          {/* Question Input */}
          <div className="space-y-2">
            <Label htmlFor="new-field-question">{dict.question}</Label>
            <Input
              id="new-field-question"
              value={currentFieldData.question || ''}
              onChange={handleQuestionChange}
              placeholder={dict.enterQuestion}
            />
          </div>

          {/* Required Checkbox - Not for RICH_TEXT or SUBMIT */}
          {currentFieldType !== 'SUBMIT' && currentFieldType !== 'RICH_TEXT' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="new-field-required"
                checked={Boolean(currentFieldData.required)}
                onCheckedChange={(checked) => handleRequiredChange(Boolean(checked))}
              />
              <Label htmlFor="new-field-required">{dict.required}</Label>
            </div>
          )}

          {/* Rich Text Editor for RICH_TEXT type */}
          {currentFieldType === 'RICH_TEXT' && (
            <div className="space-y-2">
              <Label>{dict.content}</Label>
              <RichTextEditor
                content={currentFieldData.description || '<p>Enter your content here...</p>'}
                onChange={handleDescriptionChange}
                placeholder={dict.enterContent}
                readOnly={false}
              />
            </div>
          )}

          {/* Options Management for select types */}
          {(currentFieldType === 'MULTIPLE_CHOICE' || currentFieldType === 'CHECKBOX' || currentFieldType === 'DROPDOWN') && (
            <div className="space-y-2">
              <Label>{dict.options}</Label>
              <OptionManager
                options={currentFieldData.options || ['Option 1',]}
                onUpdate={handleOptionsChange}
                fieldType={currentFieldType}
                dict={{
                  addOption: dict.addOption,
                  removeOption: dict.removeOption,
                }}
              />
            </div>
          )}

          {/* Description for other field types
          {(currentFieldType === 'PARAGRAPH' || currentFieldType === 'IMAGE_UPLOAD') && (
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                value={currentFieldData.description || ''}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="Enter description here..."
                rows={6}
              />
            </div>
          )} */}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{dict.cancel}</Button>
          <Button 
            onClick={() => onSaveFieldDetails(currentFieldData)} 
            disabled={!currentFieldData.question?.trim()}
          >
            {dict.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Update color picker component to include label
function ColorPickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (color: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Label className="text-xs font-medium mb-1">{label}</Label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-8 w-8 p-0 rounded-none border"
          style={{ backgroundColor: value }}
          onClick={() => setIsOpen(!isOpen)}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-xs font-mono"
          placeholder="#000000"
        />
      </div>
      {isOpen && (
        <div className="absolute z-50 mt-2 p-2 bg-white border shadow-lg">
          <HexColorPicker color={value} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

// Update HeaderFooterConfig component
function HeaderFooterConfig({
  type,
  config,
  onChange,
  dict,
}: {
  type: 'header' | 'footer';
  config: HeaderFooterConfig;
  onChange: (config: HeaderFooterConfig) => void;
  dict: HeaderFooterConfigDict;
}) {
  const { toast } = useToast();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: dict.logoUploadError.invalidType,
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: dict.logoUploadError.tooLarge,
        variant: "destructive",
      });
      return;
    }

    setLogoFile(file);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      onChange({ ...config, logo: data.url });
      
      toast({
        title: "Success",
        description: dict.logoUploadSuccess,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: dict.logoUploadError.uploadFailed,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setLogoFile(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {type === 'header' ? dict.enable : dict.enable}
        </Label>
        <Checkbox
          checked={config.enabled}
          onCheckedChange={(checked) => onChange({ ...config, enabled: Boolean(checked) })}
        />
      </div>

      {config.enabled && (
        <>
          <div className="space-y-2">
            <Label className="text-sm">{dict.logo}</Label>
            <div className="flex items-center gap-4">
              {config.logo && (
                <div className="relative w-16 h-16">
                  <img
                    src={config.logo}
                    alt="Logo"
                    className="w-full h-full object-contain rounded-none"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-none"
                    onClick={() => onChange({ ...config, logo: undefined })}
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={isUploading}
                  className="hidden"
                  id={`logo-upload-${type}`}
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById(`logo-upload-${type}`)?.click()}
                  disabled={isUploading}
                  className="w-full rounded-none"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      {dict.uploading}
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4 mr-2" />
                      {config.logo ? dict.changeLogo : dict.uploadLogo}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">{dict.text}</Label>
            <RichTextEditor
              content={config.text || ''}
              onChange={(content) => {
                const limitedContent = content.slice(0, 500);
                onChange({ ...config, text: limitedContent });
              }}
              placeholder={`Enter ${type} text (max 500 ${dict.maxChars})...`}
              readOnly={false}
            />
            <p className="text-xs text-muted-foreground">
              {config.text?.length || 0}/500 {dict.maxChars}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// Update HeaderFooterModal component
function HeaderFooterModal({
  isOpen,
  onClose,
  type,
  config,
  onChange,
  dict,
}: HeaderFooterModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{dict.title}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {dict.description}
          </p>
        </DialogHeader>
        <div className="py-4">
          <HeaderFooterConfig
            type={type}
            config={config}
            onChange={onChange}
            dict={{
              uploadLogo: dict.uploadLogo,
              changeLogo: dict.changeLogo,
              uploading: dict.uploading,
              maxChars: dict.maxChars,
              text: dict.text,
              logo: dict.logo,
              enable: type === 'header' ? dict.enable : dict.enable,
              logoUploadError: dict.logoUploadError,
              logoUploadSuccess: dict.logoUploadSuccess,
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{dict.close}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * GridFormBuilder Component
 * Main form builder interface component
 * 
 * Features:
 * - Grid-based form layout
 * - Drag-and-drop field positioning
 * - Real-time form preview
 * - Multiple field types
 * - Form validation
 * - Form saving and publishing
 */
export interface GridFormBuilderProps {
  dict: {
    formTitle: string;
    formDescription: string;
    enterTitle: string;
    enterDescription: string;
    colors: string;
    saving: string;
    saveForm: string;
    addHeader: string;
    editHeader: string;
    addFooter: string;
    editFooter: string;
    backgroundColor: string;
    textColor: string;
    addField: string;
    formLayout: string;
    dragFieldsHint: string;
    livePreview: string;
    previewHint: string;
    untitledForm: string;
    fieldTypes: {
      shortAnswer: string;
      paragraph: string;
      richText: string;
      multipleChoice: string;
      checkboxes: string;
      dropdown: string;
      imageUpload: string;
    };
    validation: {
      titleRequired: string;
      fieldsRequired: string;
      saveSuccess: string;
      saveSuccessDesc: string;
      saveError: string;
      tryAgain: string;
    };
    header: {
      title: string;
      description: string;
      logo: string;
      text: string;
      uploadLogo: string;
      changeLogo: string;
      uploading: string;
      maxChars: string;
      enable: string;
      close: string;
      logoUploadError: {
        invalidType: string;
        tooLarge: string;
        uploadFailed: string;
      };
      logoUploadSuccess: string;
    };
    footer: {
      title: string;
      description: string;
      logo: string;
      text: string;
      uploadLogo: string;
      changeLogo: string;
      uploading: string;
      maxChars: string;
      enable: string;
      close: string;
      logoUploadError: {
        invalidType: string;
        tooLarge: string;
        uploadFailed: string;
      };
      logoUploadSuccess: string;
    };
    fieldDetails: {
      editField: string;
      addNewField: string;
      question: string;
      enterQuestion: string;
      required: string;
      content: string;
      enterContent: string;
      options: string;
      addOption: string;
      removeOption: string;
      description: string;
      enterDesc: string;
      save: string;
      cancel: string;
    };
  };
}

export function GridFormBuilder({ dict }: GridFormBuilderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // Get reused form data from URL if present
  const reusedFormData = React.useMemo(() => {
    const reuseParam = searchParams.get('reuse');
    if (!reuseParam) return null;
    try {
      return JSON.parse(decodeURIComponent(reuseParam));
    } catch (e) {
      console.error('Failed to parse reused form data:', e);
      return null;
    }
  }, [searchParams]);

  // Initialize state with reused form data if available
  const [fields, setFields] = useState<GridFormField[]>(() => {
    if (reusedFormData?.fields) {
      // Convert reused form fields to GridFormField format
      return reusedFormData.fields.map((field: any) => ({
        id: field.id,
        i: field.id, // react-grid-layout item ID
        type: field.type,
        question: field.question,
        required: field.required,
        options: field.options || [],
        description: field.description,
        x: field.gridPosition?.x || 0,
        y: field.gridPosition?.y || 0,
        w: field.gridPosition?.width || 12,
        h: field.gridPosition?.height || 1,
        minW: GRID_CONFIG.minFieldWidth,
        maxW: GRID_CONFIG.maxFieldWidth,
        minH: GRID_CONFIG.minFieldHeight,
        isDraggable: true,
        isResizable: true,
      }));
    }
    // Default submit button if no reused data
    return [{
      id: 'submit-button',
      i: 'submit-button',
      type: 'SUBMIT',
      question: 'Submit',
      required: false,
      x: 0, y: 0, w: 4, h: 1,
      minW: 4,
      maxW: 6,
      isDraggable: true,
      isResizable: true,
    }];
  });

  const [isSaving, setIsSaving] = useState(false);
  const [formTitle, setFormTitle] = useState(reusedFormData?.title || 'Untitled Form');
  const [formDescription, setFormDescription] = useState(reusedFormData?.description || '');
  const [formStyle, setFormStyle] = useState<FormStyle>(reusedFormData?.style || {
    width: 'medium',
    alignment: 'left',
    spacing: 'comfortable',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    primaryColor: '#2563eb',
    borderColor: '#e5e7eb',
    fontFamily: 'Inter',
    headingFontSize: '1.5rem',
    bodyFontSize: '1rem'
  });
  const [bodyFontSize, setBodyFontSize] = useState(formStyle.bodyFontSize);

  // New state for adding a field via modal
  const [isNewFieldModalOpen, setIsNewFieldModalOpen] = useState(false);
  const [newFieldType, setNewFieldType] = useState<FormFieldType | null>(null);
  const [newFieldData, setNewFieldData] = useState<Partial<GridFormField>>({});

  // State for editing an existing field via modal
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [editingFieldData, setEditingFieldData] = useState<GridFormField | null>(null); // Data for field being edited

  // Add color style section to the form builder header
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Add these new states for header and footer configuration
  const [headerConfig, setHeaderConfig] = useState<HeaderFooterConfig>({
    enabled: false,
    logo: undefined,
    text: '',
  });
  const [footerConfig, setFooterConfig] = useState<HeaderFooterConfig>({
    enabled: false,
    logo: undefined,
    text: '',
  });

  // Add these new states in the GridFormBuilder component
  const [isHeaderModalOpen, setIsHeaderModalOpen] = useState(false);
  const [isFooterModalOpen, setIsFooterModalOpen] = useState(false);

  /**
   * Handles layout changes from react-grid-layout
   * Updates field positions and dimensions based on grid changes
   */
  const onLayoutChange = (layout: Layout[]) => {
    // Update field positions and dimensions based on layout changes
    setFields(currentFields => {
      return currentFields.map(field => {
        const layoutItem = layout.find(item => item.i === field.id);
        if (layoutItem) {
          // Update the field with new layout properties from react-grid-layout
          return { ...field, ...layoutItem };
        }
        return field;
      });
    });
  };

  /**
   * Handles adding a new field to the form
   * Opens the field details modal for configuration
   */
  const handleAddField = (type: FormFieldType) => {
    const fieldType = fieldTypes.find(ft => ft.type === type);
    if (!fieldType) return;

    // Set the type and open the modal for configuration
    setNewFieldType(type);
    // Initialize new field data with defaults
    setNewFieldData({
      type: type,
      question: '',
      required: false,
      options: (type === 'MULTIPLE_CHOICE' || type === 'CHECKBOX' || type === 'DROPDOWN') ? ['Option 1'] : undefined,
      description: type === 'RICH_TEXT' ? '<p>Enter your content here...</p>' : undefined, // Initialize with default HTML content
    });
    setIsNewFieldModalOpen(true);
    // Ensure editing modal is closed
    setIsEditingModalOpen(false);
    setEditingFieldData(null);
  };

  /**
   * Handles saving field details from the modal
   * Updates or adds a field based on the provided data
   */
  const handleSaveFieldDetails = (updatedFieldData: Partial<GridFormField>) => {
    // For RICH_TEXT type, ensure the content is stored in description
    if (updatedFieldData.type === 'RICH_TEXT') {
      // If there's no description, initialize with default content
      if (!updatedFieldData.description) {
        updatedFieldData.description = '<p>Enter your content here...</p>';
      }
    }

    if (editingFieldData) {
      // We are editing an existing field
      setFields(prevFields =>
        prevFields.map(field =>
          field.id === editingFieldData.id ? { ...field, ...updatedFieldData } : field
        )
      );
      setIsEditingModalOpen(false);
      setEditingFieldData(null);
    } else if (newFieldType) {
      // We are adding a new field
      const newFieldId = `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const defaultHeight = fieldTypeDefaultHeight[newFieldType] || GRID_CONFIG.defaultFieldHeight;
      const fieldTypeConfig = fieldTypes.find(ft => ft.type === newFieldType);
      const defaultWidth = fieldTypeConfig?.defaultWidth || GRID_CONFIG.minFieldWidth;

      const fieldToAdd: GridFormField = {
        ...updatedFieldData as Omit<GridFormField, 'i' | 'x' | 'y' | 'w' | 'h'>, // Cast to include required FormField properties
        id: newFieldId, // Original field ID
        i: newFieldId, // react-grid-layout item ID - required by react-grid-layout
        type: newFieldType, // Ensure type is set
        description: updatedFieldData.description ?? null, // Convert undefined to null
        // Initial position and size for react-grid-layout
        x: 0, // Start from the left
        y: Infinity, // Position at the bottom of the layout
        w: defaultWidth,
        h: defaultHeight,
        minW: GRID_CONFIG.minFieldWidth,
        maxW: GRID_CONFIG.maxFieldWidth,
        minH: GRID_CONFIG.minFieldHeight,
        isDraggable: true,
        isResizable: true,
      };

      setFields(prevFields => [...prevFields, fieldToAdd]);
      setIsNewFieldModalOpen(false);
      setNewFieldType(null);
      setNewFieldData({});
    }
  };

  /**
   * Handles deleting a field from the form
   */
  const handleDeleteField = (fieldId: string) => {
    setFields(prevFields => prevFields.filter(field => field.id !== fieldId));
  };

  /**
   * Handles form saving
   * Validates and saves the form data to the server
   */
  const handleSaveForm = async () => {
    // 1. Validation
    if (!formTitle.trim()) {
      toast({
        title: "Error",
        description: dict.validation.titleRequired,
        variant: "destructive",
      });
      return;
    }

    // Exclude the static submit button from the count if it's the only field
    const savableFields = fields.filter(field => field.type !== 'SUBMIT');
    if (savableFields.length === 0) {
      toast({
        title: "Error",
        description: dict.validation.fieldsRequired,
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // 2. Prepare form data
      const formData = {
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        fields: [
          // Include all non-submit fields
          ...fields
            .filter(field => field.type !== 'SUBMIT')
            .map(field => ({
              id: field.id,
              type: field.type,
              question: field.question.trim(),
              required: Boolean(field.required),
              options: Array.isArray(field.options) 
                ? field.options.map(opt => String(opt).trim()).filter(Boolean)
                : [],
              description: field.description ?? null,
              gridPosition: {
                x: field.x,
                y: field.y,
                width: field.w,
                height: field.h
              }
            })),
          // Always include a submit button at the end
          {
            id: 'submit-button',
            type: 'SUBMIT',
            question: 'Submit',
            required: false,
            description: null,
            gridPosition: {
              x: 0,
              y: Math.max(...fields.map(f => f.y + f.h), 0), // Position at the bottom
              width: 4,
              height: 1
            }
          }
        ],
        style: {
          ...formStyle,
          width: formStyle.width || 'medium',
          alignment: formStyle.alignment || 'left',
          spacing: formStyle.spacing || 'comfortable',
          backgroundColor: formStyle.backgroundColor || '#ffffff',
          textColor: formStyle.textColor || '#000000',
          primaryColor: formStyle.primaryColor || '#2563eb',
          borderColor: formStyle.borderColor || '#e5e7eb',
          fontFamily: formStyle.fontFamily || 'Inter',
          headingFontSize: formStyle.headingFontSize || '1.5rem',
          bodyFontSize: formStyle.bodyFontSize || '1rem'
        },
        header: headerConfig.enabled ? {
          logo: headerConfig.logo,
          text: headerConfig.text,
        } : null,
        footer: footerConfig.enabled ? {
          logo: footerConfig.logo,
          text: footerConfig.text,
        } : null,
      };

      //Send request
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error('Failed to parse response:', e);
        throw new Error('Server returned an invalid response');
      }

      if (!response.ok) {
        console.error('Server validation error:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        });
        
        // Show more detailed error message
        let errorMessage = 'Error saving form';
        if (data?.details) {
          if (Array.isArray(data.details)) {
            errorMessage = data.details.map((err: any) => 
              typeof err === 'string' ? err : 
              `${err.path || 'field'}: ${err.message || 'Invalid value'}`
            ).join('\n');
          } else if (typeof data.details === 'string') {
            errorMessage = data.details;
          } else if (typeof data.details === 'object') {
            errorMessage = Object.entries(data.details)
              .map(([key, value]) => `${key}: ${value}`)
              .join('\n');
          }
        } else if (data?.error) {
          errorMessage = data.error;
        } else if (data?.message) {
          errorMessage = data.message;
        }
        
        throw new Error(errorMessage);
      }

      
      toast({
        title: dict.validation.saveSuccess,
        description: dict.validation.saveSuccessDesc,
      });

      router.push(`/dashboard?tab=my-forms`);
    } catch (error) {
      console.error('Error saving form:', error);
      toast({
        title: "Error saving form",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // react-grid-layout uses the layout directly, which is our fields state
  const layout = fields;

  return (
    <>
      <style>{styles}</style>
      <div className="container mx-auto px-2 py-4 max-w-[1200px]">
        {/* Form Builder Header */}
        <Card className="mb-4 bg-card">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
              <div className="space-y-2 md:w-1/2">
                <Label htmlFor="form-title" className="text-sm">{dict.formTitle}</Label>
                <Input
                  id="form-title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={dict.enterTitle}
                  className="text-base font-semibold h-10 bg-background"
                />
              </div>
              <div className="space-y-2 md:w-1/2">
                <Label htmlFor="form-description" className="text-sm">{dict.formDescription}</Label>
                <Textarea
                  id="form-description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder={dict.enterDescription}
                  className="min-h-[42px] text-sm resize-none bg-background"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  variant="outline"
                  className="h-10"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 border" 
                      style={{ backgroundColor: formStyle.primaryColor }}
                    />
                    {dict.colors}
                  </div>
                </Button>
                <Button
                  onClick={handleSaveForm}
                  disabled={isSaving || !formTitle.trim() || fields.filter(field => field.type !== 'SUBMIT').length === 0}
                  className="gap-2 h-10 text-sm"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      {dict.saving}
                    </>
                  ) : (
                    dict.saveForm
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Header and Footer Configuration */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsHeaderModalOpen(true)}
                className="flex items-center gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                {headerConfig.enabled ? dict.editHeader : dict.addHeader}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsFooterModalOpen(true)}
                className="flex items-center gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                {footerConfig.enabled ? dict.editFooter : dict.addFooter}
              </Button>
            </div>

            {/* Header and Footer Modals */}
            <HeaderFooterModal
              isOpen={isHeaderModalOpen}
              onClose={() => setIsHeaderModalOpen(false)}
              type="header"
              config={headerConfig}
              onChange={setHeaderConfig}
              dict={dict.header}
            />
            <HeaderFooterModal
              isOpen={isFooterModalOpen}
              onClose={() => setIsFooterModalOpen(false)}
              type="footer"
              config={footerConfig}
              onChange={setFooterConfig}
              dict={dict.footer}
            />

            {/* Color Picker */}
            {showColorPicker && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="grid grid-cols-2 gap-4">
                  <ColorPickerField
                    label={dict.backgroundColor}
                    value={formStyle.backgroundColor}
                    onChange={(color) => setFormStyle(prev => ({ ...prev, backgroundColor: color }))}
                  />
                  <ColorPickerField
                    label={dict.textColor}
                    value={formStyle.textColor}
                    onChange={(color) => setFormStyle(prev => ({ ...prev, textColor: color }))}
                  />
                </div>
              </div>
            )}

            {/* Field Types */}
            <div className="space-y-2">
              <Label className="text-sm">{dict.addField}</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 p-3 border border-border rounded-lg bg-muted/50">
                {fieldTypes.map(({ type, label, icon: Icon }) => (
                  <Button
                    key={type}
                    variant="outline"
                    className="flex items-center justify-start gap-2 h-10 p-2 hover:bg-accent text-sm bg-card"
                    onClick={() => handleAddField(type)}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content - Grid Layout and Preview */}
        <div className="space-y-4">
          {/* Grid Layout */}
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{dict.formLayout}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {dict.dragFieldsHint}
              </p>
            </CardHeader>
            <CardContent>
              <div className="p-3 border border-border rounded-lg bg-background min-h-[450px] relative overflow-hidden">
                <div className="w-full h-full overflow-auto">
                  <GridLayout
                    className="layout"
                    layout={layout}
                    cols={GRID_CONFIG.columns}
                    rowHeight={GRID_CONFIG.rowHeight}
                    width={800}
                    margin={GRID_CONFIG.margin as [number, number]}
                    containerPadding={GRID_CONFIG.containerPadding as [number, number]}
                    onLayoutChange={onLayoutChange}
                    compactType="vertical"
                    isDroppable={false}
                    draggableHandle=".drag-handle"
                    preventCollision={false}
                    useCSSTransforms={true}
                    style={{ 
                      minHeight: '400px',
                      width: '100%',
                      maxWidth: '100%',
                      position: 'relative',
                    }}
                  >
                    {fields.map(field => (
                      <div 
                        key={field.id} 
                        className="grid-item" 
                        style={{
                          ...gridItemStyle,
                          width: '100%',
                          height: '100%',
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                        data-grid={{ 
                          i: field.i, 
                          x: field.x, 
                          y: field.y, 
                          w: field.w, 
                          h: field.h,
                          minW: field.minW || GRID_CONFIG.minFieldWidth,
                          maxW: field.maxW || GRID_CONFIG.maxFieldWidth,
                          minH: field.minH || GRID_CONFIG.minFieldHeight,
                          isDraggable: field.isDraggable !== false,
                          isResizable: field.isResizable !== false,
                        }}
                      >
                        <GridItem
                          field={field}
                          onUpdate={(updatedField) => {
                            setFields(prevFields =>
                              prevFields.map(f => f.id === updatedField.id ? updatedField : f)
                            );
                          }}
                          onDelete={handleDeleteField}
                          dict={dict.fieldDetails}
                        />
                      </div>
                    ))}
                  </GridLayout>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Preview */}
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{dict.livePreview}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {dict.previewHint}
              </p>
            </CardHeader>
            <CardContent>
              <div className="border border-border rounded-lg p-4">
                <FormPreview 
                  form={{ 
                    id: 'preview', 
                    title: formTitle || dict.untitledForm, 
                    description: formDescription,
                    style: {
                      width: formStyle.width,
                      alignment: formStyle.alignment,
                      spacing: formStyle.spacing,
                      backgroundColor: formStyle.backgroundColor || '#ffffff',
                      textColor: formStyle.textColor || '#000000',
                      borderColor: formStyle.borderColor || '#e5e7eb',
                      fontFamily: formStyle.fontFamily || 'Inter',
                      headingFontSize: formStyle.headingFontSize,
                      bodyFontSize: formStyle.bodyFontSize,
                      borderRadius: formStyle.borderRadius || 'none',
                      primaryColor: formStyle.primaryColor || '#2563eb',
                    },
                    header: headerConfig.enabled ? {
                      logo: headerConfig.logo,
                      text: headerConfig.text,
                    } : undefined,
                    footer: footerConfig.enabled ? {
                      logo: footerConfig.logo,
                      text: footerConfig.text,
                    } : undefined,
                  }} 
                  fields={fields.map(field => ({
                    id: field.id,
                    type: field.type,
                    question: field.question,
                    required: field.required,
                    options: field.options,
                    description: field.description ?? null,
                    gridPosition: { x: field.x, y: field.y, width: field.w, height: field.h },
                  }))}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modals */}
        <FieldDetailsModal
          isOpen={isNewFieldModalOpen}
          onClose={() => setIsNewFieldModalOpen(false)}
          fieldType={newFieldType}
          fieldData={newFieldData}
          onUpdateFieldData={setNewFieldData}
          onSaveFieldDetails={handleSaveFieldDetails}
          dict={dict.fieldDetails}
        />

        <FieldDetailsModal
          isOpen={isEditingModalOpen}
          onClose={() => {
            setIsEditingModalOpen(false);
            setEditingFieldData(null);
          }}
          fieldType={editingFieldData?.type || null}
          fieldData={editingFieldData || {}}
          onUpdateFieldData={(data) => {
            if (!editingFieldData) return;
            setEditingFieldData({
              ...editingFieldData,
              ...data,
              id: editingFieldData.id,
              i: editingFieldData.i,
              type: editingFieldData.type,
              x: editingFieldData.x,
              y: editingFieldData.y,
              w: editingFieldData.w,
              h: editingFieldData.h,
            });
          }}
          onSaveFieldDetails={handleSaveFieldDetails}
          initialFieldData={editingFieldData || undefined}
          dict={dict.fieldDetails}
        />

        <HeaderFooterModal
          isOpen={isHeaderModalOpen}
          onClose={() => setIsHeaderModalOpen(false)}
          type="header"
          config={headerConfig}
          onChange={setHeaderConfig}
          dict={dict.header}
        />

        <HeaderFooterModal
          isOpen={isFooterModalOpen}
          onClose={() => setIsFooterModalOpen(false)}
          type="footer"
          config={footerConfig}
          onChange={setFooterConfig}
          dict={dict.footer}
        />
      </div>
    </>
  );
} 