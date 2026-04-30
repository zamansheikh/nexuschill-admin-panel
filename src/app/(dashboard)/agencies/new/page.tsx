'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button, Card, ErrorAlert, Field, Input, PageHeader, Textarea } from '@/components/ui';
import { api } from '@/lib/api';
import type { Agency } from '@/types';

export default function NewAgencyPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [country, setCountry] = useState('BD');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [commissionRate, setCommissionRate] = useState('30');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api<{ agency: Agency }>('/admin/agencies', {
        method: 'POST',
        body: JSON.stringify({
          name,
          code,
          country: country.toUpperCase(),
          description: description || undefined,
          contactEmail: contactEmail || undefined,
          contactPhone: contactPhone || undefined,
          commissionRate: parseInt(commissionRate, 10) || 0,
        }),
      });
      router.replace('/agencies');
    } catch (err: any) {
      setError(err.message || 'Failed to create agency');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Create Agency"
        subtitle="Register a new business partner. You can later promote a user as the agency's owner admin."
      />

      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Agency name">
              <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Diamond Stars Agency" />
            </Field>
            <Field label="Short code" hint="Unique, alphanumeric (e.g. DS001)">
              <Input
                required
                pattern="^[A-Za-z0-9_-]{2,20}$"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="DS001"
              />
            </Field>
          </div>

          <Field label="Description (optional)">
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Country (ISO 2-letter)">
              <Input required maxLength={2} value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} placeholder="BD" />
            </Field>
            <Field label="Commission rate (%)" hint="Agency's share of host earnings">
              <Input type="number" min={0} max={100} value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} />
            </Field>
            <Field label="Contact phone (optional)">
              <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
            </Field>
          </div>

          <Field label="Contact email (optional)">
            <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </Field>

          {error && <ErrorAlert message={error} />}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Creating…' : 'Create agency'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
