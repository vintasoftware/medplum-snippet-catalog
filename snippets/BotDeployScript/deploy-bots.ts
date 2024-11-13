import { ContentType, getReferenceString, MedplumClient } from '@medplum/core';
import { Binary, Bot, Bundle, BundleEntry, Questionnaire } from '@medplum/fhirtypes';
import { randomUUID } from 'crypto';
import fs from 'fs';
import { BotDescription, BOTS } from './bot-descriptions.js';

function readBotFiles(description: BotDescription): Record<string, BundleEntry> {
  const sourceFile = fs.readFileSync(`src/bots/${description.name}.ts`);
  const distFile = fs.readFileSync(`dist/bots/${description.name}.js`);

  const srcEntry: BundleEntry = {
    fullUrl: 'urn:uuid:' + randomUUID(),
    request: { method: 'POST', url: 'Binary' },
    resource: {
      resourceType: 'Binary',
      contentType: ContentType.TYPESCRIPT,
      data: sourceFile.toString('base64'),
    },
  };

  const distEntry: BundleEntry = {
    fullUrl: 'urn:uuid:' + randomUUID(),
    request: { method: 'POST', url: 'Binary' },
    resource: {
      resourceType: 'Binary',
      contentType: ContentType.JAVASCRIPT,
      data: distFile.toString('base64'),
    },
  };

  return { srcEntry, distEntry };
}

async function generateBundle(): Promise<Bundle> {
  const bundle: Bundle = {
    resourceType: 'Bundle',
    type: 'transaction',
    entry: BOTS.flatMap((botDescription): BundleEntry[] => {
      const botName = botDescription.name;
      const botReferencePlaceholder = `$bot-${botName}-reference`;
      const botIdPlaceholder = `$bot-${botName}-id`;
      const results: BundleEntry[] = [];

      const { srcEntry, distEntry } = readBotFiles(botDescription);
      results.push(srcEntry, distEntry);

      results.push({
        request: { method: 'PUT', url: botReferencePlaceholder },
        resource: {
          resourceType: 'Bot',
          id: botIdPlaceholder,
          name: botName,
          runtimeVersion: 'awslambda',
          sourceCode: {
            contentType: ContentType.TYPESCRIPT,
            url: srcEntry.fullUrl,
          },
          executableCode: {
            contentType: ContentType.JAVASCRIPT,
            url: distEntry.fullUrl,
          },
        },
      });

      if (botDescription.criteria) {
        results.push({
          request: {
            method: 'PUT',
            url: `Subscription?url=${botReferencePlaceholder}`,
          },
          resource: {
            resourceType: 'Subscription',
            status: 'active',
            reason: `${botName}-subscription`,
            criteria: botDescription.criteria,
            extension: botDescription.extension ?? [],
            channel: { endpoint: botReferencePlaceholder, type: 'rest-hook', payload: 'application/fhir+json' },
          },
        });
      }

      return results;
    }),
  };

  return bundle;
}

async function uploadBots(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('\nUploading bots...\n');

  const medplum = new MedplumClient({
    clientId: process.env.DEPLOY_MEDPLUM_CLIENT_ID,
  });

  await medplum.startClientLogin(
    process.env.DEPLOY_MEDPLUM_CLIENT_ID as string,
    process.env.DEPLOY_MEDPLUM_CLIENT_SECRET as string
  );

  const projectId = medplum.getProject()?.id;

  // Provide specific questionnaires to be associated with Subscriptions
  const botsQuestionnaires = Array.from(new Set(BOTS.flatMap((bot) => bot.questionnaires)));
  const questionnaires: Questionnaire[] = botsQuestionnaires
    ? await medplum.searchResources('Questionnaire', {
        name: botsQuestionnaires.join(','),
      })
    : [];

  const bundleData = await generateBundle();
  let transactionString = JSON.stringify(bundleData);
  const botEntries: BundleEntry[] =
    (bundleData as Bundle).entry?.filter((e) => e.resource?.resourceType === 'Bot') || [];
  const botIds: Record<string, string> = {};

  for (const botDescription of BOTS) {
    const botName = botDescription.name;

    let existingBot = await medplum.searchOne('Bot', { name: botName });
    if (!existingBot) {
      const createBotUrl = new URL(`admin/projects/${projectId as string}/bot`, medplum.getBaseUrl());
      existingBot = (await medplum.post(createBotUrl, {
        name: botName,
      })) as Bot;
    }

    const botMembership = await medplum.searchOne('ProjectMembership', { user: getReferenceString(existingBot) });
    if (botMembership && botMembership.admin !== botDescription.needsAdminMembership) {
      await medplum.post(`admin/projects/${projectId as string}/members/${botMembership.id}`, {
        ...botMembership,
        admin: botDescription.needsAdminMembership,
      });
    }

    botIds[botName] = existingBot.id as string;

    // Replace the Bot id placeholder in the bundle
    transactionString = transactionString
      .replaceAll(`$bot-${botName}-reference`, getReferenceString(existingBot))
      .replaceAll(`$bot-${botName}-id`, existingBot.id as string);
  }

  for (const questionnaire of questionnaires) {
    transactionString = transactionString.replaceAll(`$${questionnaire.name}`, getReferenceString(questionnaire));
  }

  // eslint-disable-next-line no-console
  console.log('\nUploading bots bundle...\n');

  // console.log(JSON.stringify(JSON.parse(transactionString), null, 2));

  // Execute the transaction to upload / update the bot
  const transaction = JSON.parse(transactionString);
  const batchResponse = await medplum.executeBatch(transaction);

  const errors = batchResponse.entry?.filter((e) => !['200', '201'].includes(e.response?.status ?? ''));
  if (errors && errors.length > 0) {
    throw new Error(`${JSON.stringify(errors, null, 2)}`);
  }

  // Deploy the bots
  for (const entry of botEntries) {
    const botName = (entry?.resource as Bot)?.name as string;
    const distUrl = (entry.resource as Bot).executableCode?.url;

    const distBinaryEntry = bundleData.entry?.find((e) => e.fullUrl === distUrl);
    if (!distBinaryEntry) {
      throw new Error(`Could not find dist binary entry for ${botName}`);
    }

    // eslint-disable-next-line no-console
    console.log(`Deploying ${botName}...`);

    // Decode the base64 encoded code and deploy
    const code = atob((distBinaryEntry.resource as Binary).data as string);
    await medplum.post(medplum.fhirUrl('Bot', botIds[botName], '$deploy'), { code });
  }

  // eslint-disable-next-line no-console
  console.log('\nAll bots deployed!\n');
}

// eslint-disable-next-line no-console
uploadBots().catch(console.error);
