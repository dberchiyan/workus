// @ts-check
import eslint from '@eslint/js';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const crossModuleInternals = ['repository', 'controller'].flatMap((layer) => [
    `../..${layer}${layer}*/${layer}*/${layer}*/${layer}generated/prismarepository*.ts',
            'src/common/security/permission.service.ts',
            'prismacontrollerrepositorycontroller/mapper*.ts', 'scripts*.ts'],
        rules: { '@typescript-eslint/no-magic-numbers': 'off' },
    },
);
