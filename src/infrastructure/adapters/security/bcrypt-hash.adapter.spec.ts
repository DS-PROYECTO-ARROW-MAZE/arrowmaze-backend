import { ConfigService } from '@nestjs/config';
import { BcryptHashAdapter } from './bcrypt-hash.adapter';

describe('BcryptHashAdapter', () => {
  let adapter: BcryptHashAdapter;

  beforeEach(() => {
    const configService = {
      get: jest.fn().mockReturnValue('4'),
    } as unknown as ConfigService;
    adapter = new BcryptHashAdapter(configService);
  });

  it('should_return_a_different_string_when_hashing_a_plain_password', async () => {
    // Arrange
    const plain = 'secreta123';

    // Act
    const hash = await adapter.hash(plain);

    // Assert
    expect(hash).not.toBe(plain);
    expect(typeof hash).toBe('string');
  });

  it('should_return_true_when_comparing_a_plain_password_with_its_own_hash', async () => {
    // Arrange
    const plain = 'secreta123';
    const hash = await adapter.hash(plain);

    // Act
    const result = await adapter.compare(plain, hash);

    // Assert
    expect(result).toBe(true);
  });

  it('should_return_false_when_comparing_a_wrong_password_with_a_hash', async () => {
    // Arrange
    const plain = 'secreta123';
    const hash = await adapter.hash(plain);

    // Act
    const result = await adapter.compare('wrong-password', hash);

    // Assert
    expect(result).toBe(false);
  });
});
