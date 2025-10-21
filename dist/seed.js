"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// prisma/seed.ts
// Script para poblar la base de datos con datos de prueba
var client_1 = require("@prisma/client");
var bcryptjs_1 = require("bcryptjs");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var hashedPassword, admin, user1, user2, entidades;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🌱 Iniciando seed de la base de datos...');
                    return [4 /*yield*/, bcryptjs_1.default.hash('123456', 12)];
                case 1:
                    hashedPassword = _a.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: 'admin@llanogas.com' },
                            update: {},
                            create: {
                                email: 'admin@llanogas.com',
                                name: 'Administrador Sistema',
                                password: hashedPassword,
                                role: 'ADMIN',
                            },
                        })];
                case 2:
                    admin = _a.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: 'ana.garcia@llanogas.com' },
                            update: {},
                            create: {
                                email: 'ana.garcia@llanogas.com',
                                name: 'Ana García',
                                password: hashedPassword,
                                role: 'USER',
                            },
                        })];
                case 3:
                    user1 = _a.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: 'carlos.rodriguez@llanogas.com' },
                            update: {},
                            create: {
                                email: 'carlos.rodriguez@llanogas.com',
                                name: 'Carlos Rodríguez',
                                password: hashedPassword,
                                role: 'USER',
                            },
                        })];
                case 4:
                    user2 = _a.sent();
                    return [4 /*yield*/, Promise.all([
                            prisma.entidad.upsert({
                                where: { sigla: 'SUI' },
                                update: {},
                                create: {
                                    nombre: 'Superintendencia de Servicios Públicos',
                                    sigla: 'SUI',
                                    color: '#3B82F6',
                                    email: 'sui@superservicios.gov.co',
                                    descripcion: 'Entidad encargada de la supervisión de servicios públicos'
                                },
                            }),
                            prisma.entidad.upsert({
                                where: { sigla: 'SS' },
                                update: {},
                                create: {
                                    nombre: 'Superservicios',
                                    sigla: 'SS',
                                    color: '#10B981',
                                    email: 'contacto@superservicios.gov.co',
                                    descripcion: 'Superintendencia de Servicios Públicos Domiciliarios'
                                },
                            }),
                            prisma.entidad.upsert({
                                where: { sigla: 'MME' },
                                update: {},
                                create: {
                                    nombre: 'Ministerio de Minas y Energía',
                                    sigla: 'MME',
                                    color: '#8B5CF6',
                                    email: 'minminas@minminas.gov.co',
                                    descripcion: 'Ministerio encargado del sector minero energético'
                                },
                            }),
                        ])];
                case 5:
                    entidades = _a.sent();
                    console.log('✅ Seed completado!');
                    console.log('👤 Usuarios creados:', admin.email, user1.email, user2.email);
                    console.log('🏢 Entidades creadas:', entidades.length);
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error('❌ Error en seed:', e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
