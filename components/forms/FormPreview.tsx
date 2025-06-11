/**
 * FormPreview Component
 * 
 * A professional form preview and submission interface that renders forms with:
 * - Responsive grid layout
 * - Multiple field types (text, paragraph, multiple choice, etc.)
 * - Form submission handling
 * - Print functionality
 * - Read-only mode for viewing submissions
 * - Real-time validation
 * - Rich text display
 * - Image upload preview
 * 
 * @component
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/lib/schemas/form';
import { useToast } from '@/components/ui/use-toast';
import { PrinterIcon, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useDictionary } from '@/hooks/useDictionary';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

/**
 * Grid layout configuration constants
 * Defines the layout parameters for the form preview grid
 */
// const GRID_CELL_SIZE = 100; // pixels
// const GRID_COLUMNS = 12; // 12-column grid system
// const MOBILE_BREAKPOINT = 640; // sm breakpoint

// Type definitions for form field values
type TextValue = string;
type ParagraphValue = string;
type MultipleChoiceValue = string;
type CheckboxValue = string[];
type DropdownValue = string;
type ImageValue = string | null;
type RichTextValue = string;
type TextWithCheckboxValue = {
  items: Array<{
    checked: boolean;
    text: string;
  }>;
};

// Form width type
type FormWidth = 'small' | 'medium' | 'large';
type FormAlignment = 'left' | 'center' | 'right';
type FormSpacing = 'comfortable' | 'compact' | 'spacious';
type FormBorderRadius = 'sm' | 'md' | 'lg';

// Combined type for all possible form response values
export type FormResponseValue = 
  | TextValue 
  | ParagraphValue 
  | MultipleChoiceValue 
  | CheckboxValue 
  | DropdownValue 
  | ImageValue 
  | RichTextValue 
  | TextWithCheckboxValue;

// Form field types
export type FormFieldType = 
  | 'TEXT'
  | 'PARAGRAPH'
  | 'MULTIPLE_CHOICE'
  | 'CHECKBOX'
  | 'DROPDOWN'
  | 'SUBMIT'
  | 'IMAGE_UPLOAD'
  | 'RICH_TEXT'
  | 'TEXT_WITH_CHECKBOX'
  | 'SEPARATOR';

// Update FormStyle type to match the schema
type FormStyle = {
  width: FormWidth;
  alignment: FormAlignment;
  spacing: FormSpacing;
  borderRadius: FormBorderRadius;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  fontFamily: string;
  headingFontSize: string;
  bodyFontSize: string;
  primaryColor: string;
};

// Form response data type
export type FormResponseData = Record<string, FormResponseValue>;

/**
 * Gets the field value with proper type handling
 */
function getFieldValue(value: FormResponseValue | undefined, fieldType: string): string | string[] | undefined {
  if (value === undefined || value === null) {
    return fieldType === 'CHECKBOX' ? [] : '';
  }
  
  // Handle specific field types
  switch (fieldType) {
    case 'CHECKBOX':
      return Array.isArray(value) ? value : [];
    case 'TEXT_WITH_CHECKBOX':
      if (typeof value === 'object' && 'items' in value) {
        return value.items
          .filter(item => item.checked)
          .map(item => `${item.text}`);
      }
      return [];
    default:
      return String(value);
  }
}

/**
 * FormPreviewProps Interface
 * Defines the props for the FormPreview component
 * 
 * @interface
 * @property {Object} form - Form metadata
 * @property {string} form.id - Unique form identifier
 * @property {string} form.title - Form title
 * @property {string|null} form.description - Form description
 * @property {FormStyle} [form.style] - Form styling options
 * @property {FormField[]} fields - Array of form fields
 * @property {boolean} [isPublic=false] - Whether the form is publicly accessible
 * @property {FormResponseData} [submissionResponses] - Existing submission responses
 * @property {boolean} [isReadOnly=false] - Whether the form is in read-only mode
 * @property {Date} [submissionDate] - Submission date
 */
interface FormPreviewProps {
  form: {
    id: string;
    title: string;
    description: string | null;
    style?: FormStyle;
    header?: {
      logo?: string;
      text?: string;
    } | null;
    footer?: {
      logo?: string;
      text?: string;
    } | null;
    fields: FormField[];
  };
  submissionResponses?: FormResponseData;
  isReadOnly?: boolean;
  submissionDate?: Date;
  onSubmit?: (data: FormResponseData) => void;
}

/**
 * Process form style utility function
 * Handles parsing and validation of form styles with proper type assertions
 * 
 * @param {unknown} rawStyle - The raw style object from the database
 * @returns {FormStyle} Processed and validated form style
 */
function processFormStyle(rawStyle: unknown): FormStyle {
  try {
    const style = typeof rawStyle === 'string' 
      ? JSON.parse(rawStyle) 
      : rawStyle;

    if (style && typeof style === 'object') {
      const borderRadius = style.borderRadius === 'none' ? 'md' : style.borderRadius;
      return {
        width: (style.width as FormWidth) || 'medium',
        alignment: (style.alignment as FormAlignment) || 'left',
        spacing: (style.spacing as FormSpacing) || 'comfortable',
        borderRadius: (borderRadius as FormBorderRadius) || 'md',
        backgroundColor: String(style.backgroundColor || '#ffffff'),
        textColor: String(style.textColor || '#000000'),
        borderColor: String(style.borderColor || '#e5e7eb'),
        fontFamily: String(style.fontFamily || 'Inter'),
        headingFontSize: String(style.headingFontSize || '1.5rem'),
        bodyFontSize: String(style.bodyFontSize || '1rem'),
        primaryColor: String(style.primaryColor || '#2563eb'),
      };
    }
  } catch (error) {
    console.warn('Error processing form style:', error);
  }

  return {
    width: 'medium',
    alignment: 'left',
    spacing: 'comfortable',
    borderRadius: 'md',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    borderColor: '#e5e7eb',
    fontFamily: 'Inter',
    headingFontSize: '1.5rem',
    bodyFontSize: '1rem',
    primaryColor: '#2563eb',
  };
}

// Add this component for TEXT_WITH_CHECKBOX field type
function TextWithCheckboxField({ 
  field, 
  value, 
  onChange,
  style,
}: { 
  field: FormField; 
  value: TextWithCheckboxValue; 
  onChange: (value: TextWithCheckboxValue) => void;
  style: FormStyle;
}) {
  const getBorderRadiusStyle = (borderRadius: string) => {
    return borderRadius === 'none' ? '0' : undefined;
  };

  // Initialize value.items if it doesn't exist or has different length than options
  const items = value.items || field.options?.map(() => ({ checked: false, text: '' })) || [];

  const commonInputStyle = {
    color: style.textColor,
    fontFamily: style.fontFamily,
    borderColor: style.borderColor || '#e5e7eb',
    backgroundColor: 'transparent',
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium" style={{ color: style.textColor }}>
        {field.question}
      </Label>
      <div className="space-y-3">
        {field.options?.map((option, index) => (
          <div 
            key={index} 
            className="group space-y-2"
          >
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${field.id}-option-${index}`}
                checked={items[index]?.checked || false}
                onCheckedChange={(checked) => {
                  const newItems = [...items];
                  newItems[index] = {
                    ...newItems[index],
                    checked: Boolean(checked),
                    text: Boolean(checked) ? (newItems[index]?.text || '') : ''
                  };
                  onChange({ items: newItems });
                }}
                className="transition-transform group-hover:scale-105"
                style={{
                  borderColor: style.borderColor,
                  borderRadius: getBorderRadiusStyle(style.borderRadius),
                }}
              />
              <Label 
                htmlFor={`${field.id}-option-${index}`}
                className="text-sm font-medium transition-colors group-hover:text-gray-900"
                style={{ color: style.textColor }}
              >
                {option}
              </Label>
            </div>
            {items[index]?.checked && (
              <div className="pl-6">
                <Input
                  id={`${field.id}-text-${index}`}
                  type="text"
                  value={items[index]?.text || ''}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[index] = {
                      ...newItems[index],
                      text: e.target.value
                    };
                    onChange({ items: newItems });
                  }}
                  placeholder={`Enter details for ${option}...`}
                  className="w-full py-1 px-2 h-7 text-sm border rounded-md transition-all focus:ring-1 focus:ring-primary/20"
                  style={{
                    ...commonInputStyle,
                    textAlign: style.alignment === 'center' ? 'center' : 
                             style.alignment === 'right' ? 'right' : 'left',
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * FormPreview Component
 * Renders a form with preview and submission capabilities
 * 
 * @param {FormPreviewProps} props - Component props
 * @returns {JSX.Element} Rendered form preview
 */
export function FormPreview({
  form,
  submissionResponses,
  isReadOnly = false,
  submissionDate,
  onSubmit,
}: FormPreviewProps) {
  // State management
  const { toast } = useToast();
  const [responses, setResponses] = useState<FormResponseData>(submissionResponses || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const dict = useDictionary();
  const router = useRouter();

  // Use submissionResponses in read-only mode
  const currentResponses = isReadOnly ? submissionResponses : responses;

  // Process form style
  const style = processFormStyle(form.style);

  /**
   * Utility functions for responsive styling
   * These functions return appropriate CSS classes based on form style settings
   */
  const getAlignmentClass = () => {
    switch (style.alignment) {
      case 'left': return 'items-start text-left';
      case 'center': return 'items-center text-center';
      case 'right': return 'items-end text-right';
      default: return 'items-start text-left';
    }
  };

  const getSpacingClass = () => {
    switch (style.spacing) {
      case 'compact': return 'space-y-3';
      case 'comfortable': return 'space-y-4';
      case 'spacious': return 'space-y-6';
      default: return 'space-y-4';
    }
  };

  const getBorderRadiusClass = () => {
    return 'rounded-none';
  };

  /**
   * Handles form submission
   * Validates required fields and submits form data to the server
   */
  const handleSubmit = async (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault();
    }
    
    setIsSubmitting(true);

    const missingRequired = form.fields.filter(
      field => field.required && !responses[field.id]
    );

    if (missingRequired.length > 0) {
      toast({
        title: dict.formPreview.validation.requiredFields,
        description: `${missingRequired.map(f => f.question).join(', ')}`,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      if (onSubmit) {
        onSubmit(responses);
        return;
      }

      const response = await fetch(`/api/forms/${form.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          responses: responses
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          toast({
            title: dict.formPreview.submission.alreadySubmitted,
            description: (
              <div className="mt-2">
                <p>{data.message}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {dict.formPreview.submission.submittedOn.replace("{0}", new Date(data.submittedAt).toLocaleString())}
                </p>
                <Link
                  href={`/submissions/${data.submissionId}` as `/${string}`}
                  className="text-primary hover:underline mt-2 inline-block"
                >
                  {dict.formPreview.submission.viewSubmission}
                </Link>
              </div>
            ),
            variant: "default",
          });
          return;
        }
        throw new Error(data.error || data.message || dict.formPreview.validation.submitError);
      }

      toast({
        title: dict.formPreview.validation.submitSuccess,
        description: dict.formPreview.validation.thankYou,
      });

      setIsSubmitted(true);
    } catch (error) {
      toast({
        title: dict.formPreview.validation.submitError,
        description: error instanceof Error ? error.message : dict.formPreview.validation.tryAgain,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
/**
 * Handles form printing
 * Generates a print-friendly version of the form with responses
 */
const handlePrint = () => {
  setIsPrinting(true);
       
  // Add print-only class to body when printing
  document.body.classList.add('printing');
       
  try {
    window.print();
  } finally {
    // Remove print-only class after printing
    document.body.classList.remove('printing');
    setIsPrinting(false);
  }
};

// Add useEffect to inject print styles
useEffect(() => {
  // Create style element for print media
  const style = document.createElement('style');
  style.innerHTML = `
    @media print {
      /* Remove all page margins */
      @page {
        margin: 20mm;
        size: auto;
      }
      
      /* Hide everything except the form */
      body * {
        visibility: hidden;
      }
             
      /* Show only form content */
      #form-to-print,
      #form-to-print * {
        visibility: visible;
      }
             
      /* Position form container */
      #form-to-print {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

     
      /* Hide print button when printing */
      .print-button {
        display: none !important;
      }
             
      /* Remove background colors and shadows for better printing */
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* Ensure clean page breaks */
      body {
        margin: 0;
        padding: 0;
      }
    }
  `;
       
  // Add style to document head
  document.head.appendChild(style);
       
  // Cleanup function
  return () => {
    document.head.removeChild(style);
  };
}, []);
  // Filter fields for rendering (exclude submit button in read-only mode)
  const fieldsToRender = isReadOnly ? form.fields.filter(field => field.type !== 'SUBMIT') : form.fields;

  /**
   * Renders a form field based on its type
   * Handles different field types and their specific rendering requirements
   * 
   * @param {FormField} field - Form field to render
   * @returns {JSX.Element|null} Rendered field component
   */
  const renderField = (field: FormField) => {
    const commonClasses = `
      w-full 
      p-2
      rounded-none
      border-0
      border-b
      transition-colors 
      focus:ring-0
      focus:border-b-2
      text-sm
      h-8
      ${getAlignmentClass()}
    `;
    const labelClasses = `
      block 
      text-xs
      font-medium 
      mb-1
      ${getAlignmentClass()}
    `;

    // Determine the value to display/use based on read-only mode
    const fieldValue = currentResponses?.[field.id];

    const commonInputStyle = {
      color: style.textColor,
      fontFamily: style.fontFamily,
      borderColor: style.borderColor || '#e5e7eb',
      backgroundColor: 'rgba(243, 244, 246, 0.5)', // Light grey with transparency
    };

    // Helper function to get simple value
    const getSimpleValue = (value: FormResponseValue | undefined): string => {
      if (value === undefined || value === null) return '';
      if (typeof value === 'string') return value;
      if (Array.isArray(value)) return value.join(', ');
      if (typeof value === 'object' && 'items' in value) {
        return value.items
          .filter(item => item.checked)
          .map(item => item.text)
          .join(', ');
      }
      return String(value);
    };

    switch (field.type) {
      case 'TEXT':
        return (
          <div className={`space-y-1 ${getAlignmentClass()}`}>
            <Label 
              htmlFor={field.id} 
              className={labelClasses}
              style={{ color: style.textColor }}
            >
              {field.question}
              {field.required && !isReadOnly && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {isReadOnly ? (
              <div 
                className={`p-2 text-sm break-words whitespace-pre-wrap ${getAlignmentClass()}`}
                style={{ 
                  ...commonInputStyle,
                  backgroundColor: `${style.backgroundColor}80`,
                  maxHeight: '300px',
                  overflowY: 'auto',
                  minHeight: '40px'
                }}
              >
                {getSimpleValue(fieldValue) || ''}
              </div>
            ) : (
              <Input
                id={field.id}
                name={field.id}
                value={typeof fieldValue === 'string' ? fieldValue : getSimpleValue(fieldValue)}
                onChange={(e) => setResponses(prev => ({ ...prev, [field.id]: e.target.value }))}
                required={field.required}
                className={commonClasses}
                style={{
                  ...commonInputStyle,
                  textAlign: style.alignment === 'center' ? 'center' : 
                           style.alignment === 'right' ? 'right' : 'left',
                }}
              />
            )}
          </div>
        );

      case 'PARAGRAPH':
        return (
          <div className={`space-y-1 ${getAlignmentClass()}`}>
            <Label htmlFor={field.id} className={labelClasses} style={{ color: style.textColor }}>
              {field.question}
              {field.required && !isReadOnly && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {isReadOnly ? (
              <div 
                className={`p-2 bg-gray-50/50 text-sm whitespace-pre-wrap break-words ${getAlignmentClass()}`}
                style={{ 
                  fontFamily: style.fontFamily,
                  color: style.textColor,
                  backgroundColor: `${style.backgroundColor}80`,
                  maxHeight: '500px',
                  overflowY: 'auto',
                  minHeight: '80px'
                }}
              >
                {getSimpleValue(fieldValue) || ''}
              </div>
            ) : (
              <Textarea
                id={field.id}
                name={field.id}
                value={typeof fieldValue === 'string' ? fieldValue : getSimpleValue(fieldValue)}
                onChange={(e) => setResponses(prev => ({ ...prev, [field.id]: e.target.value }))}
                required={field.required}
                className={`${commonClasses} h-20`}
                style={{
                  ...commonInputStyle,
                  color: style.textColor,
                  borderColor: style.borderColor,
                  fontFamily: style.fontFamily,
                  textAlign: style.alignment === 'center' ? 'center' : 
                           style.alignment === 'right' ? 'right' : 'left',
                }}
              />
            )}
          </div>
        );

      case 'MULTIPLE_CHOICE':
        return (
          <div className="space-y-1">
            <Label className={labelClasses} style={{ color: style.textColor }}>
              {field.question}
              {field.required && !isReadOnly && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {isReadOnly ? (
              <div className="p-2 bg-gray-50/50 text-sm" style={{ 
                fontFamily: style.fontFamily,
                color: style.textColor,
                backgroundColor: `${style.backgroundColor}80`,
              }}>
                {String(fieldValue || '')}
              </div>
            ) : (
              <RadioGroup
                value={String(getFieldValue(fieldValue, 'RADIO') || '')}
                onValueChange={(value) => setResponses(prev => ({ ...prev, [field.id]: value }))}
                required={field.required}
                className="flex flex-wrap gap-4"
              >
                {field.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={option}
                      id={`${field.id}-${index}`}
                      className="h-3 w-3 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 border data-[state=checked]:bg-transparent data-[state=checked]:border-[3px]"
                      style={{ 
                        color: style.textColor,
                        borderColor: style.textColor,
                      }}
                    />
                    <Label
                      htmlFor={`${field.id}-${index}`}
                      className="text-xs"
                      style={{ color: style.textColor }}
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>
        );

      case 'CHECKBOX':
        return (
          <div className="space-y-1">
            <Label className={labelClasses} style={{ color: style.textColor }}>
              {field.question}
              {field.required && !isReadOnly && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {isReadOnly ? (
              <div className="p-2 bg-gray-50/50 text-sm break-words" style={{ 
                fontFamily: style.fontFamily,
                color: style.textColor,
                backgroundColor: `${style.backgroundColor}80`,
                maxHeight: '300px',
                overflowY: 'auto',
                minHeight: '40px'
              }}>
                {Array.isArray(fieldValue) ? fieldValue.join(', ') : ''}
              </div>
            ) : (
              <div className="flex flex-wrap gap-4">
                {field.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${field.id}-${index}`}
                      checked={Array.isArray(fieldValue) ? fieldValue.includes(option) : false}
                      onCheckedChange={(checked) => {
                        const currentValues = Array.isArray(fieldValue) ? fieldValue : [];
                        const newValues = checked
                          ? [...currentValues, option]
                          : currentValues.filter((v: string) => v !== option);
                        setResponses(prev => ({ ...prev, [field.id]: newValues as string[] }));
                      }}
                      className="h-3 w-3 border-gray-300"
                      style={{ borderColor: style.borderColor }}
                    />
                    <Label
                      htmlFor={`${field.id}-${index}`}
                      className="text-xs"
                      style={{ color: style.textColor }}
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'DROPDOWN':
        return (
          <div className="space-y-1">
            <Label htmlFor={field.id} className={labelClasses} style={{ color: style.textColor }}>
              {field.question}
              {field.required && !isReadOnly && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {isReadOnly ? (
              <div className="p-2 bg-gray-50/50 text-sm" style={{ 
                fontFamily: style.fontFamily,
                color: style.textColor,
                backgroundColor: `${style.backgroundColor}80`,
              }}>
                {String(fieldValue || '')}
              </div>
            ) : (
              <Select
                value={String(getFieldValue(fieldValue, 'SELECT') || '')}
                onValueChange={(value) => setResponses(prev => ({ ...prev, [field.id]: value }))}
                required={field.required}
              >
                <SelectTrigger
                  className={`${commonClasses} h-8 border-b rounded-none`}
                  style={{
                    ...commonInputStyle,
                    color: style.textColor,
                    borderColor: style.borderColor,
                    fontFamily: style.fontFamily,
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent 
                  className="bg-white border-0 shadow-lg rounded-none"
                  style={{
                    backgroundColor: style.backgroundColor,
                    borderColor: style.borderColor,
                  }}
                >
                  {field.options?.map((option, index) => (
                    <SelectItem
                      key={index}
                      value={option}
                      className="text-xs hover:bg-gray-50 rounded-none"
                      style={{ 
                        color: style.textColor,
                        fontFamily: style.fontFamily,
                      }}
                    >
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        );

      case 'IMAGE_UPLOAD':
        return (
          <div className="space-y-1">
            <Label htmlFor={field.id} className={labelClasses}>
              {field.question}
              {field.required && !isReadOnly && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {isReadOnly ? (
              <div className="p-2 bg-gray-50/50" style={{ fontFamily: style.fontFamily }}>
                {fieldValue ? (
                  <Image 
                    src={getFieldValue(fieldValue, 'IMAGE') as string} 
                    alt="Uploaded image" 
                    width={200} 
                    height={200}
                    className="max-w-full object-contain rounded-lg"
                  />
                ) : (
                  dict.formPreview.imageUpload.noImage
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <div 
                  className="border-0 border-b border-dashed p-6 text-center transition-colors hover:border-gray-400 rounded-none"
                  style={{ borderColor: style.borderColor }}
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    {fieldValue ? (
                      <>
                        <Image 
                          src={getFieldValue(fieldValue, 'IMAGE') as string} 
                          alt="Preview" 
                          width={200} 
                          height={200}
                          className="max-w-full h-32 object-contain rounded-none mb-2"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setResponses(prev => ({ ...prev, [field.id]: null }))}
                          className="text-red-500 hover:text-red-700 rounded-none"
                        >
                          {dict.formPreview.imageUpload.remove}
                        </Button>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                        <div className="text-sm text-gray-600">
                          <p>{dict.formPreview.imageUpload.clickToUpload}</p>
                          <p className="text-xs text-gray-500">{dict.formPreview.imageUpload.fileTypes}</p>
                        </div>
                        <Input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id={`file-${field.id}`}
                          onChange={async (e) => {
                            e.preventDefault(); // Prevent default behavior
                            e.stopPropagation(); // Stop event propagation
                            
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                // Create form data
                                const formData = new FormData();
                                formData.append('file', file);

                                // Upload file
                                const response = await fetch('/api/upload', {
                                  method: 'POST',
                                  body: formData,
                                });

                                if (!response.ok) {
                                  const error = await response.json();
                                  throw new Error(error.error || 'Upload failed');
                                }

                                const data = await response.json();
                                
                                // Update form response with the image URL
                                setResponses(prev => ({ 
                                  ...prev, 
                                  [field.id]: data.url 
                                }));

                                toast({
                                  title: "Success",
                                  description: dict.formPreview.imageUpload.success,
                                });
                              } catch (error) {
                                console.error('Upload error:', error);
                                toast({
                                  title: "Upload failed",
                                  description: error instanceof Error ? error.message : dict.formPreview.imageUpload.error,
                                  variant: "destructive",
                                });
                              }
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            document.getElementById(`file-${field.id}`)?.click();
                          }}
                          className="rounded-none"
                          style={{
                            borderColor: style.borderColor,
                            color: style.textColor,
                          }}
                        >
                          {dict.formPreview.buttons.chooseFile}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {field.description && (
                  <p className="text-sm text-gray-500" style={{ color: style.textColor }}>
                    {field.description}
                  </p>
                )}
              </div>
            )}
          </div>
        );

      case 'RICH_TEXT':
        return (
          <div className="space-y-1">
            <div 
              className="prose prose-sm max-w-none border-0 rounded-none" 
              style={{ 
                color: style.textColor,
                fontFamily: style.fontFamily,
              }}
              dangerouslySetInnerHTML={{ 
                __html: field.description || `<p>${dict.formPreview.noContent}</p>` 
              }}
            />
          </div>
        );

      case 'TEXT_WITH_CHECKBOX':
        const textWithCheckboxDefaultValue: TextWithCheckboxValue = {
          items: field.options?.map(() => ({ checked: false, text: '' })) || []
        };
        const currentTextWithCheckboxValue = (currentResponses?.[field.id] as TextWithCheckboxValue) || textWithCheckboxDefaultValue;
        
        if (isReadOnly) {
          // Filter to show only checked items
          const checkedItems = currentTextWithCheckboxValue.items
            .map((item, index) => ({ ...item, option: field.options?.[index] }))
            .filter(item => item.checked);

          return (
            <div className="space-y-4">
              <Label className="text-sm font-medium" style={{ color: style.textColor }}>
                {field.question}
              </Label>
              <div className="space-y-2">
                {checkedItems.map((item, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="flex items-center h-9 pt-1">
                      <Checkbox
                        checked={true}
                        disabled={true}
                        style={{
                          borderColor: style.borderColor,
                          cursor: 'default'
                        }}
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label 
                        className="text-sm font-normal block"
                        style={{ color: style.textColor }}
                      >
                        {item.option}
                      </Label>
                      <div 
                        className="p-2 bg-gray-50/50 text-sm break-words"
                        style={{ 
                          fontFamily: style.fontFamily,
                          color: style.textColor,
                          backgroundColor: `${style.backgroundColor}80`,
                          minHeight: '32px'
                        }}
                      >
                        {item.text || ''}
                      </div>
                    </div>
                  </div>
                ))}
                {checkedItems.length === 0 && (
                  <div className="text-sm text-gray-500">No options selected</div>
                )}
              </div>
            </div>
          );
        }

        return (
          <TextWithCheckboxField
            field={field}
            value={currentTextWithCheckboxValue}
            onChange={(value) => setResponses(prev => ({ ...prev, [field.id]: value }))}
            style={style}
          />
        );

      case 'SUBMIT':
        if (isReadOnly) return null;
        
        return (
          <div 
            className={`form-field transition-colors ${getAlignmentClass()}`}
            style={{ color: style.textColor }}
          >
            <Button
              type="submit"
              style={{
                backgroundColor: style.primaryColor,
                color: '#ffffff',
                width: style.alignment === 'center' ? 'auto' : '100%',
              }}
              className={cn(
                "h-10 px-8",
                style.alignment === 'center' ? 'mx-auto' : '',
                style.alignment === 'right' ? 'ml-auto' : ''
              )}
              disabled={isSubmitting}
            >
              {isSubmitting ? dict.formPreview.buttons.preparing : dict.formPreview.buttons.submit}
            </Button>
          </div>
        );

      case 'SEPARATOR':
        return (
          <div className="w-full py-4">
            <div 
              className="h-[3px] w-full" 
              style={{ 
                backgroundColor: style.textColor,
                opacity: 0.15
              }} 
            />
          </div>
        );

      default:
        return null;
    }
  };
  return (
    <div className="w-full flex justify-center">
      <div id="form-to-print" className="w-[800px] sm:w-full md:w-[800px] lg:w-[800px] xl:w-[800px] 2xl:w-[800px] max-w-full" >
        {/* Print-only header */}

        {isReadOnly && (
          <div className="flex justify-end mb-2 print-button">
            <Button
              onClick={handlePrint}
              disabled={isPrinting}
              variant="ghost"
              size="sm"
              className="gap-2 h-8 hover:bg-transparent rounded-none focus:ring-0"
            >
              <PrinterIcon className="h-3 w-3" />
              {isPrinting ? dict.formPreview.buttons.preparing : dict.formPreview.buttons.print}
            </Button>
          </div>
        )}

        <div 
          className="border border-border rounded-lg"
          style={{ backgroundColor: style.backgroundColor }}
        >
          {form.header && (
            <div className="  border-b border-border p-4 flex items-center gap-4">
              {form.header.logo && (
                <div className="flex-shrink-0">
                  <Image
                    src={form.header.logo}
                    alt="Header Logo"
                    width={48}
                    height={48}
                    className="h-12 w-auto object-contain"
                  />
                </div>
              )}
              {form.header.text && (
                <div 
                  className="prose prose-sm max-w-none flex-1"
                  dangerouslySetInnerHTML={{ __html: form.header.text }}
                  style={{ color: style.textColor }}
                />
              )}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!isReadOnly && !isSubmitted) {
                handleSubmit();
              }
            }}
            className={`
              form-content
              w-full flex flex-col items-center
              ${getSpacingClass()} 
              p-4
              ${getBorderRadiusClass()} 
              ${(isReadOnly || isSubmitted) ? 'mt-8' : ''}
              text-sm
            `}
            style={{
              color: style.textColor || '#000000',
              fontFamily: style.fontFamily || 'Inter',
              backgroundColor: style.backgroundColor || '#ffffff',
            }}
          >
            {isSubmitted ? (
              <div className="text-center space-y-4" style={{ color: style.textColor }}>
                <div className="text-xl font-semibold" style={{ color: style.textColor }}>
                  {dict.formPreview.submission.success}
                </div>
                <p className="text-sm opacity-80" style={{ color: style.textColor }}>
                  {dict.formPreview.submission.thankYou}
                </p>
                {!isReadOnly && (
                  <div className="flex justify-center gap-4 mt-4">
                    <Button
                      variant="default"
                      onClick={() => router.push('/dashboard?tab=forms')}
                      className="rounded-none"
                      style={{
                        backgroundColor: style.primaryColor,
                        color: '#ffffff',
                      }}
                    >
                      {dict.formPreview.buttons.close}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-2 w-full text-center">
                  <h2 
                    className="text-2xl font-bold" 
                    style={{ 
                      color: style.textColor,
                      fontFamily: style.fontFamily 
                    }}
                  >
                    {form.title}
                  </h2>
                  {form.description && (
                    <p 
                      className="text-sm opacity-80" 
                      style={{ 
                        color: style.textColor,
                        fontFamily: style.fontFamily 
                      }}
                    >
                      {form.description}
                    </p>
                  )}
                </div>

                <div className={`
                  w-full
                  ${getSpacingClass()} 
                  p-4
                  ${getBorderRadiusClass()} 
                  ${(isReadOnly || isSubmitted) ? 'mt-8' : ''}
                  text-sm
                `}>
                  <div className="grid grid-cols-12 grid-auto-rows-min">
                    {((): React.ReactNode => {
                      const sections: Array<{
                        fields: typeof fieldsToRender;
                        separator?: typeof fieldsToRender[0];
                      }> = [];
                      let currentSection: typeof fieldsToRender = [];

                      fieldsToRender.forEach((field) => {
                        if (field.type === 'SEPARATOR') {
                          if (currentSection.length > 0) {
                            sections.push({ fields: currentSection, separator: field });
                            currentSection = [];
                          }
                        } else {
                          currentSection.push(field);
                        }
                      });

                      if (currentSection.length > 0) {
                        sections.push({ fields: currentSection });
                      }

                      return sections.map((section, sectionIndex) => (
                        <div 
                          key={sectionIndex}
                          className="col-span-12"
                        >
                          <div className="grid grid-cols-12 grid-auto-rows-min">
                            {section.fields.map((field) => {
                              const gridPos = field.gridPosition || { x: 0, y: 0, width: 12, height: 1 };
                              
                              return (
                                <div 
                                  key={field.id} 
                                  className={`form-field transition-colors ${field.type !== 'RICH_TEXT' ? 'p-0' : 'border-0'} ${gridPos.y > 0 ? 'mt-2' : ''}`}
                                  style={{
                                    gridColumnStart: gridPos.x + 1,
                                    gridColumnEnd: `span ${gridPos.width}`,
                                    gridRow: gridPos.y + 1,
                                    color: style.textColor,
                                  }}
                                >
                                  {renderField(field)}
                                </div>
                              );
                            })}
                          </div>
                          {section.separator && (
                            <div className="w-full">
                              {renderField(section.separator)}
                            </div>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Form ID and submission date footer */}
                <div className="flex justify-center">
                  <div className="text-[10px] opacity-40 text-center" style={{ color: style.textColor }}>
                    {form.id}
                    {isReadOnly && submissionDate && (
                      <> • {new Date(submissionDate).toLocaleString()}</>
                    )}
                  </div>
                </div>
                {form.footer && (
                  <div className="border-t border-border p-4  flex items-center gap-4">
                    {form.footer.logo && (
                      <div className="flex-shrink-0">
                        <Image
                          src={form.footer.logo}
                          alt="Footer Logo"
                          width={48}
                          height={48}
                          className="h-12 w-auto object-contain"
                        />
                      </div>
                    )}
                    {form.footer.text && (
                      <div 
                        className="prose prose-sm max-w-none flex-1"
                        dangerouslySetInnerHTML={{ __html: form.footer.text }}
                        style={{ color: style.textColor }}
                      />
                    )}
                  </div>
                )}
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}