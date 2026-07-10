import { Field, FieldError } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Save } from "lucide-react";
import React, { useEffect, useState } from "react";
import z from "zod";

interface NumberInputGroupProps {
  value?: number;
  onSave?: (value: number) => void;
  inputGroupAddons?: React.ReactNode;
  saveButtonProps?: React.ComponentPropsWithoutRef<typeof InputGroupButton>;
  disabled?: boolean;
  min?: number;
  max?: number;
}

const NumberInputGroup = ({
  value,
  onSave,
  inputGroupAddons,
  saveButtonProps,
  disabled,
  min,
  max,
}: NumberInputGroupProps) => {
  const [val, setVal] = useState<number | undefined>(
    isNaN(value ?? NaN) ? undefined : value,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVal(isNaN(value ?? NaN) ? undefined : value);
    setError(null);
  }, [value]);

  const handleSave = (value: number) => {
    const zod = z
      .number()
      .min(min ?? 1, `Value must be at least ${min ?? 1}`)
      .max(
        max ?? Number.MAX_SAFE_INTEGER,
        `Value must be at most ${max ?? Number.MAX_SAFE_INTEGER}`,
      );

    const result = zod.safeParse(value);
    if (!result.success) {
      setError(z.treeifyError(result.error)?.errors?.[0]);
      return;
    }

    setError(null);
    onSave?.(value);
  };

  return (
    <Field data-invalid={!!error}>
      <InputGroup>
        <InputGroupInput
          type="number"
          value={val}
          onChange={(e) => {
            if (disabled) return;
            const number = e.target.valueAsNumber;
            setVal(isNaN(number) ? undefined : number);
          }}
          readOnly={disabled}
        />
        <InputGroupAddon align="inline-end">
          {inputGroupAddons}
          <InputGroupButton
            variant="default"
            {...saveButtonProps}
            onClick={() => {
              if (disabled) return;
              if (val !== undefined) {
                handleSave(val);
              }
            }}
            disabled={disabled || val === undefined}
          >
            <Save /> Save
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <FieldError>{error}</FieldError>
    </Field>
  );
};

export default NumberInputGroup;
