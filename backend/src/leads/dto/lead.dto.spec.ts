import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateLeadDto, UpdateLeadDto } from './lead.dto';

async function validateCreate(payload: Record<string, unknown>) {
  const dto = plainToInstance(CreateLeadDto, payload);
  return { dto, errors: await validate(dto) };
}

async function validateUpdate(payload: Record<string, unknown>) {
  const dto = plainToInstance(UpdateLeadDto, payload);
  return { dto, errors: await validate(dto) };
}

describe('Lead DTOs', () => {
  it('accepts a phone containing only digits', async () => {
    const { dto, errors } = await validateCreate({ name: 'Ana', phone: '987654321' });
    expect(errors).toHaveLength(0);
    expect(dto.phone).toBe('987654321');
  });

  it('accepts and normalizes an international phone', async () => {
    const { dto, errors } = await validateCreate({ name: 'Ana', phone: '+51 987 654 321' });
    expect(errors).toHaveLength(0);
    expect(dto.phone).toBe('+51987654321');
  });

  it('normalizes phone spaces, hyphens and parentheses', async () => {
    const { dto, errors } = await validateCreate({ name: 'Ana', phone: '(987) 654-321' });
    expect(errors).toHaveLength(0);
    expect(dto.phone).toBe('987654321');
  });

  it.each(['abc', '987abc321'])('rejects letters in phone %s', async (phone) => {
    const { errors } = await validateCreate({ name: 'Ana', phone });
    expect(errors.some((error) => error.property === 'phone')).toBe(true);
  });

  it('rejects a phone with fewer than 7 digits', async () => {
    const { errors } = await validateCreate({ name: 'Ana', phone: '123' });
    expect(errors.some((error) => error.property === 'phone')).toBe(true);
  });

  it('rejects a phone with more than 15 digits', async () => {
    const { errors } = await validateCreate({ name: 'Ana', phone: '1234567890123456' });
    expect(errors.some((error) => error.property === 'phone')).toBe(true);
  });

  it('trims and lowercases email', async () => {
    const { dto, errors } = await validateCreate({ name: '  José Pérez  ', email: ' TEST@GMAIL.COM ' });
    expect(errors).toHaveLength(0);
    expect(dto.name).toBe('José Pérez');
    expect(dto.email).toBe('test@gmail.com');
  });

  it('rejects an invalid supplied email even when phone is valid', async () => {
    const { errors } = await validateCreate({ name: 'Ana', email: 'invalid', phone: '987654321' });
    expect(errors.some((error) => error.property === 'email')).toBe(true);
  });

  it('requires email or phone', async () => {
    const { errors } = await validateCreate({ name: 'Ana', email: ' ', phone: '' });
    expect(errors.some((error) => error.constraints?.hasContact)).toBe(true);
  });

  it('rejects names shorter than 2 or longer than 100 characters', async () => {
    const short = await validateCreate({ name: 'a', phone: '987654321' });
    const long = await validateCreate({ name: 'a'.repeat(101), phone: '987654321' });
    expect(short.errors.some((error) => error.property === 'name')).toBe(true);
    expect(long.errors.some((error) => error.property === 'name')).toBe(true);
  });

  it('rejects notes longer than 5000 characters', async () => {
    const { errors } = await validateCreate({ name: 'Ana', phone: '987654321', notes: 'a'.repeat(5001) });
    expect(errors.some((error) => error.property === 'notes')).toBe(true);
  });

  it('rejects a negative budget', async () => {
    const { errors } = await validateCreate({ name: 'Ana', phone: '987654321', estimatedBudget: -10 });
    expect(errors.some((error) => error.property === 'estimatedBudget')).toBe(true);
  });

  it('rejects a budget with more than 2 decimal places', async () => {
    const { errors } = await validateCreate({ name: 'Ana', phone: '987654321', estimatedBudget: 10.123 });
    expect(errors.some((error) => error.property === 'estimatedBudget')).toBe(true);
  });

  it('rejects a budget above the configured maximum', async () => {
    const { errors } = await validateCreate({ name: 'Ana', phone: '987654321', estimatedBudget: 1_000_000_000 });
    expect(errors.some((error) => error.property === 'estimatedBudget')).toBe(true);
  });

  it('also rejects an invalid phone on update', async () => {
    const { errors } = await validateUpdate({ phone: 'abcdef' });
    expect(errors.some((error) => error.property === 'phone')).toBe(true);
  });

  it('rejects past follow-up dates on create but permits existing overdue dates on update', async () => {
    const past = '2020-01-01T12:00:00.000Z';
    const create = await validateCreate({ name: 'Ana', phone: '987654321', nextFollowUpAt: past });
    const update = await validateUpdate({ nextFollowUpAt: past });
    expect(create.errors.some((error) => error.property === 'nextFollowUpAt')).toBe(true);
    expect(update.errors).toHaveLength(0);
  });
});
