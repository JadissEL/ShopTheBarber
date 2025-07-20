import React from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "./form";
import { useForm } from "react-hook-form";

export const FormShowcase = () => {
  const form = useForm();

  return (
    <div className="w-full max-w-4xl mx-auto p-8 space-y-12">
      {/* 🎨 Button Showcase */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-moroccan-charcoal mb-4">Premium Button System</h2>
          <p className="text-moroccan-darkgrey">Explore our comprehensive button variants with Moroccan styling</p>
        </div>

        {/* Primary Buttons */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-moroccan-charcoal">Primary Variants</h3>
          <div className="flex flex-wrap gap-4">
            <Button variant="default">Default</Button>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="accent">Accent</Button>
            <Button variant="premium">Premium</Button>
          </div>
        </div>

        {/* Outline Buttons */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-moroccan-charcoal">Outline Variants</h3>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline">Outline</Button>
            <Button variant="outline-gold">Outline Gold</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
        </div>

        {/* Role-based Buttons */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-moroccan-charcoal">Role-based Variants</h3>
          <div className="flex flex-wrap gap-4">
            <Button variant="admin">Admin</Button>
            <Button variant="barber">Barber</Button>
            <Button variant="client">Client</Button>
          </div>
        </div>

        {/* Button Sizes */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-moroccan-charcoal">Button Sizes</h3>
          <div className="flex flex-wrap items-center gap-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="xl">Extra Large</Button>
          </div>
        </div>

        {/* Button States */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-moroccan-charcoal">Button States</h3>
          <div className="flex flex-wrap gap-4">
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
            <Button animation="pulse">Pulse</Button>
            <Button animation="glow">Glow</Button>
          </div>
        </div>
      </section>

      {/* 🎨 Input Showcase */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-moroccan-charcoal mb-4">Premium Input System</h2>
          <p className="text-moroccan-darkgrey">Discover our enhanced input components with Moroccan elegance</p>
        </div>

        {/* Input Variants */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-moroccan-charcoal">Input Variants</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-moroccan-charcoal">Default Input</label>
              <Input placeholder="Enter your text..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-moroccan-charcoal">Premium Input</label>
              <Input variant="premium" placeholder="Premium styling..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-moroccan-charcoal">Outline Input</label>
              <Input variant="outline" placeholder="Outline style..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-moroccan-charcoal">Filled Input</label>
              <Input variant="filled" placeholder="Filled background..." />
            </div>
          </div>
        </div>

        {/* Input with Icons */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-moroccan-charcoal">Input with Icons</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-moroccan-charcoal">Left Icon</label>
              <Input 
                leftIcon={
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
                placeholder="Search users..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-moroccan-charcoal">Right Icon</label>
              <Input 
                rightIcon={
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
                placeholder="Search..."
              />
            </div>
          </div>
        </div>

        {/* Input Sizes */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-moroccan-charcoal">Input Sizes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-moroccan-charcoal">Small</label>
              <Input size="sm" placeholder="Small input..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-moroccan-charcoal">Default</label>
              <Input placeholder="Default size..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-moroccan-charcoal">Large</label>
              <Input size="lg" placeholder="Large input..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-moroccan-charcoal">Extra Large</label>
              <Input size="xl" placeholder="Extra large..." />
            </div>
          </div>
        </div>
      </section>

      {/* 🎨 Form Showcase */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-moroccan-charcoal mb-4">Complete Form Example</h2>
          <p className="text-moroccan-darkgrey">See all components working together in a real form</p>
        </div>

        <div className="bg-white rounded-xl shadow-moroccan-xl p-8">
          <Form {...form}>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your first name" {...field} />
                      </FormControl>
                      <FormDescription>Your given name</FormDescription>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your last name" {...field} />
                      </FormControl>
                      <FormDescription>Your family name</FormDescription>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="your.email@example.com" 
                        leftIcon={
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        }
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>We'll never share your email</FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="service"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Service</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="haircut">Haircut & Styling</SelectItem>
                        <SelectItem value="beard">Beard Trim</SelectItem>
                        <SelectItem value="shave">Traditional Shave</SelectItem>
                        <SelectItem value="facial">Facial Treatment</SelectItem>
                        <SelectItem value="package">Complete Package</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Choose your preferred grooming service</FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Requests</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any special requests or preferences..."
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>Let us know about any specific requirements</FormDescription>
                  </FormItem>
                )}
              />

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button type="submit" variant="premium" size="lg" className="flex-1">
                  Book Appointment
                </Button>
                <Button type="button" variant="outline" size="lg">
                  Save Draft
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </section>
    </div>
  );
}; 