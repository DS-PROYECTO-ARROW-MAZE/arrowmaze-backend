import { JwtService } from '@nestjs/jwt';
import { JwtAdapter } from './jwt.adapter';

describe('JwtAdapter', () => {
  let adapter: JwtAdapter;
  const principal = { id: 'user-id', email: 'jac@test.com' };

  beforeEach(() => {
    const jwtService = new JwtService({ secret: 'test-secret' });
    adapter = new JwtAdapter(jwtService);
  });

  it('should_return_a_signed_string_when_firmando_a_principal', () => {
    const token = adapter.firmar(principal);

    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('should_return_the_same_principal_when_verificando_its_own_token', () => {
    const token = adapter.firmar(principal);

    const resultado = adapter.verificar(token);

    expect(resultado).toEqual(principal);
  });

  it('should_return_null_when_verificando_a_malformed_token', () => {
    const resultado = adapter.verificar('not-a-real-token');

    expect(resultado).toBeNull();
  });

  it('should_return_null_when_verificando_a_token_signed_with_a_different_secret', () => {
    const otroServicio = new JwtService({ secret: 'another-secret' });
    const otroAdapter = new JwtAdapter(otroServicio);
    const token = otroAdapter.firmar(principal);

    const resultado = adapter.verificar(token);

    expect(resultado).toBeNull();
  });
});
