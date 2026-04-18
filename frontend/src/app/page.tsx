import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils, Activity, Dumbbell } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  return (
    <div className="space-y-6" style={{ padding: "40px 48px" }}>
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Bem-vindo ao seu painel de saúde</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/alimentacao">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Utensils className="h-5 w-5 text-orange-400" />
              <CardTitle className="text-base">Alimentação</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Registre refeições e acompanhe nutrição</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/saude">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Activity className="h-5 w-5 text-green-400" />
              <CardTitle className="text-base">Saúde</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Peso, pressão, sono e mais métricas</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/exercicios">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Dumbbell className="h-5 w-5 text-blue-400" />
              <CardTitle className="text-base">Exercícios</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Treinos, séries e evolução física</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
