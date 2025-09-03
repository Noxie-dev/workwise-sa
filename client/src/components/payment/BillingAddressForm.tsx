import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin } from 'lucide-react';
import { BillingAddress, SOUTH_AFRICAN_PROVINCES } from '@/types/payment';

interface BillingAddressFormProps {
  onSubmit: (data: BillingAddress) => void;
  defaultValues?: Partial<BillingAddress>;
  disabled?: boolean;
}

/**
 * Billing Address Form Component
 * Handles South African billing address collection for Stripe payments
 */
const BillingAddressForm: React.FC<BillingAddressFormProps> = ({
  onSubmit,
  defaultValues,
  disabled = false
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<BillingAddress>({
    defaultValues: {
      country: 'South Africa',
      ...defaultValues
    },
    mode: 'onChange'
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-secondary-foreground">
          <MapPin className="w-5 h-5 text-primary" />
          Billing Address
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* House Number and Street Name */}
          <div className="flex space-x-4">
            <div className="w-1/3">
              <Label htmlFor="houseNumber" className="text-sm font-medium text-secondary-foreground">
                House Number*
              </Label>
              <Controller
                name="houseNumber"
                control={control}
                rules={{
                  required: 'House number is required',
                  pattern: {
                    value: /^\d+[A-Za-z]?$/,
                    message: 'Invalid house number format'
                  }
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="houseNumber"
                    placeholder="e.g., 123"
                    disabled={disabled}
                    className={`mt-1 ${errors.houseNumber ? 'border-destructive' : ''}`}
                  />
                )}
              />
              {errors.houseNumber && (
                <p className="text-sm text-destructive mt-1">{errors.houseNumber.message}</p>
              )}
            </div>
            <div className="w-2/3">
              <Label htmlFor="streetName" className="text-sm font-medium text-secondary-foreground">
                Street Name*
              </Label>
              <Controller
                name="streetName"
                control={control}
                rules={{
                  required: 'Street name is required',
                  minLength: {
                    value: 2,
                    message: 'Street name must be at least 2 characters'
                  }
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="streetName"
                    placeholder="e.g., Main Street"
                    disabled={disabled}
                    className={`mt-1 ${errors.streetName ? 'border-destructive' : ''}`}
                  />
                )}
              />
              {errors.streetName && (
                <p className="text-sm text-destructive mt-1">{errors.streetName.message}</p>
              )}
            </div>
          </div>

          {/* Apartment Number */}
          <div>
            <Label htmlFor="apartmentNo" className="text-sm font-medium text-secondary-foreground">
              Apartment No:
            </Label>
            <Controller
              name="apartmentNo"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="apartmentNo"
                  placeholder="e.g., Apt 4B"
                  disabled={disabled}
                  className="mt-1"
                />
              )}
            />
          </div>

          {/* Suburb */}
          <div>
            <Label htmlFor="suburb" className="text-sm font-medium text-secondary-foreground">
              Suburb
            </Label>
            <Controller
              name="suburb"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="suburb"
                  placeholder="e.g., Maboneng"
                  disabled={disabled}
                  className="mt-1"
                />
              )}
            />
          </div>

          {/* City/Town */}
          <div>
            <Label htmlFor="cityTown" className="text-sm font-medium text-secondary-foreground">
              City/Town*
            </Label>
            <Controller
              name="cityTown"
              control={control}
              rules={{
                required: 'City/Town is required',
                minLength: {
                  value: 2,
                  message: 'City/Town must be at least 2 characters'
                }
              }}
              render={({ field }) => (
                <Input
                  {...field}
                  id="cityTown"
                  placeholder="e.g., Johannesburg"
                  disabled={disabled}
                  className={`mt-1 ${errors.cityTown ? 'border-destructive' : ''}`}
                />
              )}
            />
            {errors.cityTown && (
              <p className="text-sm text-destructive mt-1">{errors.cityTown.message}</p>
            )}
          </div>

          {/* Province and Postal Code */}
          <div className="flex space-x-4">
            <div className="w-1/2">
              <Label htmlFor="province" className="text-sm font-medium text-secondary-foreground">
                Province*
              </Label>
              <Controller
                name="province"
                control={control}
                rules={{
                  required: 'Province is required'
                }}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={disabled}
                  >
                    <SelectTrigger className={`mt-1 ${errors.province ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Select a province" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOUTH_AFRICAN_PROVINCES.map((province) => (
                        <SelectItem key={province} value={province}>
                          {province}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.province && (
                <p className="text-sm text-destructive mt-1">{errors.province.message}</p>
              )}
            </div>
            <div className="w-1/2">
              <Label htmlFor="postalCode" className="text-sm font-medium text-secondary-foreground">
                Postal Code*
              </Label>
              <Controller
                name="postalCode"
                control={control}
                rules={{
                  required: 'Postal code is required',
                  pattern: {
                    value: /^\d{4}$/,
                    message: 'Postal code must be 4 digits'
                  }
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="postalCode"
                    placeholder="e.g., 1234"
                    disabled={disabled}
                    className={`mt-1 ${errors.postalCode ? 'border-destructive' : ''}`}
                  />
                )}
              />
              {errors.postalCode && (
                <p className="text-sm text-destructive mt-1">{errors.postalCode.message}</p>
              )}
            </div>
          </div>

          {/* Country */}
          <div>
            <Label htmlFor="country" className="text-sm font-medium text-secondary-foreground">
              Country*
            </Label>
            <Controller
              name="country"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="country"
                  value="South Africa"
                  disabled
                  className="mt-1 cursor-not-allowed bg-muted"
                />
              )}
            />
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default BillingAddressForm;