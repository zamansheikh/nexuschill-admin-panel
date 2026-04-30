'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button, Card, ErrorAlert, Field, Input, PageHeader, Textarea } from '@/components/ui';
import { api } from '@/lib/api';
import type { Reseller } from '@/types';

export default function NewResellerPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [country, setCountry] = useState('BD');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [creditLimit, setCreditLimit] = useState('0');
  const [commissionRate, setCommissionRate] = useState('0');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api<{ reseller: Reseller }>('/admin/resellers', {
        method: 'POST',
        body: JSON.stringify({
          name,
          code,
          country: country.toUpperCase(),
          description: description || undefined,
          contactEmail: contactEmail || undefined,
          contactPhone: contactPhone || undefined,
          creditLimit: parseInt(creditLimit, 10) || 0,
          commissionRate: parseInt(commissionRate, 10) || 0,
        }),
      });
      router.replace('/resellers');
    } catch (err: any) {
      setError(err.message || 'Failed to create');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Create Reseller"
        subtitle="Coin distribution partner. Initial pool starts at 0 — top up after creation."
      />

      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name">
              <Input required value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Short code (unique)" hint="e.g. CK001">
              <Input
                required
                pattern="^[A-Za-z0-9_-]{2,20}$"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </Field>
          </div>

          <Field label="Description (optional)">
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Country (ISO 2)">
              <Input
                required
                maxLength={2}
                value={country}
                onChange={(e) => setCountry(e.target.value.toUpperCase())}
              />
            </Field>
            <Field label="Credit limit (0 = unlimited)" hint="Max pool size">
              <Input type="number" min={0} value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} />
            </Field>
            <Field label="Commission %" hint="Informational (no payment yet)">
              <Input
                type="number"
                min={0}
                max={100}
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Contact email">
              <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            </Field>
            <Field label="Contact phone">
              <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
            </Field>
          </div>

          {error && <ErrorAlert message={error} />}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Creating…' : 'Create reseller'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
