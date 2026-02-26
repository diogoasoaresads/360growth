import RegisterForm from "./register-form";

export const metadata = {
  title: "Registrar | AgencyHub",
  description: "Crie sua conta na AgencyHub",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">AgencyHub</h1>
          <p className="text-slate-400 mt-2">Crie sua agência em minutos</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
