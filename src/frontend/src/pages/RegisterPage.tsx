import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: async () => {
      setSuccess(true);
      setError(null);
      
      // Auto-login después del registro
      setTimeout(async () => {
        try {
          const tokens = await authApi.login({
            email: formData.email,
            password: formData.password,
          });
          
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          
          const userData = await authApi.getMe();
          setAuth(userData, tokens.accessToken, tokens.refreshToken);
          navigate('/dashboard');
        } catch (err) {
          navigate('/login');
        }
      }, 1500);
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.error?.message || 
                          err.response?.data?.message || 
                          'Error al registrar usuario. Intenta nuevamente.';
      setError(errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (!/[A-Z]/.test(formData.password)) {
      setError('La contraseña debe contener al menos una mayúscula');
      return;
    }

    if (!/[0-9]/.test(formData.password)) {
      setError('La contraseña debe contener al menos un número');
      return;
    }

    if (!/[!@#$%^&*]/.test(formData.password)) {
      setError('La contraseña debe contener al menos un carácter especial (!@#$%^&*)');
      return;
    }

    // Nota: En producción, el tenantId debería obtenerse de alguna manera
    // Por ahora, usaremos el tenant de ACME Petroleum de los seeds
    registerMutation.mutate({
      email: formData.email,
      username: formData.username,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      tenantId: 'acme-petroleum', // Placeholder - debería venir del contexto
    });
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Crear Cuenta</CardTitle>
          <CardDescription className="text-center">
            Completa el formulario para registrarte en el sistema
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert variant="success">
                <AlertDescription>
                  ¡Registro exitoso! Redirigiendo al dashboard...
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Juan"
                  value={formData.firstName}
                  onChange={handleChange('firstName')}
                  disabled={registerMutation.isPending || success}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Pérez"
                  value={formData.lastName}
                  onChange={handleChange('lastName')}
                  disabled={registerMutation.isPending || success}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Usuario *</Label>
              <Input
                id="username"
                type="text"
                placeholder="jperez"
                value={formData.username}
                onChange={handleChange('username')}
                required
                disabled={registerMutation.isPending || success}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="jperez@acme-petroleum.com"
                value={formData.email}
                onChange={handleChange('email')}
                required
                disabled={registerMutation.isPending || success}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange('password')}
                required
                disabled={registerMutation.isPending || success}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange('confirmPassword')}
                required
                disabled={registerMutation.isPending || success}
              />
            </div>

            <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-md">
              <p className="font-medium mb-1">Requisitos de contraseña:</p>
              <p>• Mínimo 8 caracteres</p>
              <p>• Al menos una mayúscula</p>
              <p>• Al menos un número</p>
              <p>• Al menos un carácter especial (!@#$%^&*)</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={registerMutation.isPending || success}
            >
              {registerMutation.isPending ? 'Registrando...' : success ? '¡Registro exitoso!' : 'Crear Cuenta'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Inicia sesión aquí
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
