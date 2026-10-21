'use client';

import { useActionState, useEffect, useRef } from 'react';

import { AppLink } from '@/components/ui/AppLink';
import { type AuthActionState } from '@/features/auth/login-action';
import { registerAction } from '@/features/auth/register-action';
import { AUTH_INPUT_CLASS, AUTH_LABEL_CLASS } from '@/features/auth/ui/auth-field-styles';
import { PasswordField } from '@/features/auth/ui/PasswordField';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

const initialState: AuthActionState = {};

type RegisterFormProps = {
  locale: Locale;
  dictionary: Dictionary['auth'];
};

function fieldClass(invalid: boolean): string {
  return invalid ? `${AUTH_INPUT_CLASS} border-red-500` : AUTH_INPUT_CLASS;
}

export function RegisterForm({ locale, dictionary }: RegisterFormProps) {
  const action = registerAction.bind(null, locale);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const values = state.values;
  const invalidField = state.field;
  const revision = state.revision ?? 0;
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const form = formRef.current;
    if (!form || !values || revision === 0) {
      return;
    }

    for (const [name, value] of Object.entries(values)) {
      const element = form.elements.namedItem(name);
      if (element instanceof HTMLInputElement) {
        element.value = value;
      }
    }

    if (!invalidField) {
      return;
    }

    const invalid = form.elements.namedItem(invalidField);
    if (invalid instanceof HTMLInputElement) {
      invalid.focus();
    }
  }, [invalidField, revision, values]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 min-[28rem]:grid-cols-2">
        <label className={AUTH_LABEL_CLASS}>
          {dictionary.firstName}
          <input
            key={`firstName-${revision}`}
            required
            name="firstName"
            autoComplete="given-name"
            defaultValue={values?.firstName ?? ''}
            aria-invalid={invalidField === 'firstName'}
            className={fieldClass(invalidField === 'firstName')}
          />
        </label>
        <label className={AUTH_LABEL_CLASS}>
          {dictionary.lastName}
          <input
            key={`lastName-${revision}`}
            required
            name="lastName"
            autoComplete="family-name"
            defaultValue={values?.lastName ?? ''}
            aria-invalid={invalidField === 'lastName'}
            className={fieldClass(invalidField === 'lastName')}
          />
        </label>
      </div>

      <label className={AUTH_LABEL_CLASS}>
        {dictionary.email}
        <input
          key={`email-${revision}`}
          required
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={values?.email ?? ''}
          aria-invalid={invalidField === 'email'}
          className={fieldClass(invalidField === 'email')}
        />
      </label>

      <label className={AUTH_LABEL_CLASS}>
        {dictionary.phone}
        <input
          key={`phone-${revision}`}
          required
          name="phone"
          type="tel"
          autoComplete="tel"
          defaultValue={values?.phone ?? ''}
          aria-invalid={invalidField === 'phone'}
          className={fieldClass(invalidField === 'phone')}
        />
      </label>

      <PasswordField
        name="password"
        label={dictionary.password}
        showPasswordLabel={dictionary.showPassword}
        hidePasswordLabel={dictionary.hidePassword}
        autoComplete="new-password"
        variant="brand"
        defaultValue={values?.password ?? ''}
        invalid={invalidField === 'password'}
        inputKey={`password-${revision}`}
      />

      <PasswordField
        name="confirmPassword"
        label={dictionary.confirmPassword}
        showPasswordLabel={dictionary.showPassword}
        hidePasswordLabel={dictionary.hidePassword}
        autoComplete="new-password"
        variant="brand"
        defaultValue={values?.confirmPassword ?? ''}
        invalid={invalidField === 'confirmPassword'}
        inputKey={`confirmPassword-${revision}`}
      />

      {state.error ? (
        <p
          role="alert"
          className="rounded-2xl border border-red-400/50 bg-red-50 p-3 text-sm text-red-700"
        >
          {state.error}
        </p>
      ) : null}

      <button
        disabled={isPending}
        className="h-12 rounded-full bg-[#ff6b00] px-4 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
      >
        {isPending ? dictionary.submittingRegister : dictionary.submitRegister}
      </button>

      <p className="text-center text-sm text-[#1e1e1e]/70">
        {dictionary.hasAccount}{' '}
        <AppLink
          href={`/${locale}/login`}
          prefetchPolicy="intent"
          className="font-bold text-[#ff6b00] underline-offset-2 hover:underline"
        >
          {dictionary.signInLink}
        </AppLink>
      </p>
    </form>
  );
}
