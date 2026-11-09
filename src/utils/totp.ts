import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';

export interface TOTPSetupData {
  secret: string;
  otpauthUri: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

const ISSUER_NAME = 'Heckler Family';

/**
 * Cria uma instância configurada do TOTP para o Google Authenticator
 */
export const createTOTP = (email: string, secretBase32: string): OTPAuth.TOTP => {
  return new OTPAuth.TOTP({
    issuer: ISSUER_NAME,
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });
};

/**
 * Gera um novo segredo Base32 e dados para o Google Authenticator
 */
export const generateTOTPSetup = async (email: string): Promise<TOTPSetupData> => {
  // 160 bits (20 bytes) = 32 caracteres Base32 padrão da indústria (RFC 6238)
  const secretObj = new OTPAuth.Secret({ size: 20 });
  const secretBase32 = secretObj.base32;

  const totp = new OTPAuth.TOTP({
    issuer: ISSUER_NAME,
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: secretObj,
  });

  const otpauthUri = totp.toString();

  // Gera o QR Code visual para ser escaneado pela câmera do celular no Google Authenticator
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 250,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });

  const backupCodes = generateBackupCodes(6);

  return {
    secret: secretBase32,
    otpauthUri,
    qrCodeDataUrl,
    backupCodes,
  };
};

/**
 * Valida o token de 6 dígitos gerado pelo Google Authenticator
 * Aceita uma janela de tolerância de +/- 1 período (30 segundos) para compensar desvios de relógio
 */
export const verifyTOTPToken = (secretBase32: string, token: string, email: string = 'user'): boolean => {
  if (!secretBase32 || !token) return false;
  
  const cleanToken = token.replace(/\s+/g, '').trim();
  if (cleanToken.length !== 6 || !/^\d+$/.test(cleanToken)) {
    return false;
  }

  try {
    const totp = createTOTP(email, secretBase32);
    const delta = totp.validate({
      token: cleanToken,
      window: 1, // Janela de +/- 30 segundos
    });

    return delta !== null;
  } catch (err) {
    console.error('Erro na validação do token TOTP:', err);
    return false;
  }
};

/**
 * Gera códigos de backup de emergência formatados (ex: 8492-3810)
 */
export const generateBackupCodes = (count: number = 6): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const p1 = Math.floor(1000 + Math.random() * 9000);
    const p2 = Math.floor(1000 + Math.random() * 9000);
    codes.push(`${p1}-${p2}`);
  }
  return codes;
};

/**
 * Calcula os segundos restantes no ciclo atual de 30 segundos do TOTP
 */
export const getTOTPTimeRemaining = (): number => {
  const epoch = Math.floor(Date.now() / 1000);
  return 30 - (epoch % 30);
};
