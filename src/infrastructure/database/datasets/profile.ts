import { Prisma } from "../generated/client";

export const profiles: Prisma.ProfileCreateManyInput[] = [
    {
        id: "00000000-0000-4000-8000-000000000001",
        createdAt: new Date("2026-10-06T00:00:00.000Z"),
        updatedAt: null,
        isRevoked: false,
        name: "Егоров Даниил",
        description:
            "Ведущий fullstack-разработчик. С 2020 года разрабатываю продукты для финансового сектора и e-commerce: от пользовательских интерфейсов до высоконагруженных сервисов и систем управления доступом. Основной стек — TypeScript, Go, React и Vue. Проектирую архитектуру, внедряю тестирование и observability, развиваю процессы разработки. Есть опыт руководства командой, найма и проведения технических интервью.",
        links: [
            { label: "GitHub", url: "https://github.com/Lambdius" },
            { label: "Telegram", url: "https://t.me/lambdius" },
        ],
    },
];
