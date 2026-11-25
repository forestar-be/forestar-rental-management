---
id: equivalences-location
scope: domain
paths: ['src/components/machine/MachineEquivalences.tsx', 'src/pages/SingleMachine.tsx', 'src/utils/api.ts']
tags: [location, forestar-241]
last_reviewed: 2026-11-25
review_after_days: 90
confidence: verified
---

# Suggestions (équivalences) de location dans la fiche machine

L'onglet Suggestions (anciennement Équivalences) enregistre une liste de destinations publiques orientées et
ordonnées. Une variante peut hériter de la liste de la machine ou choisir une liste
spécifique, y compris vide. La note de chaque destination est visible sur la vitrine.

L'enregistrement utilise le client API authentifié et le jeton CSRF habituel en mode
SSO. Il envoie la révision lue pour la configuration source. Après un conflit de
révision, le bouton Recharger relit la liste du serveur. Les destinations dont la base
est masquée disparaissent des choix physiques du catalogue, tandis que leurs variantes
restent sélectionnables.

## Mode de proposition (FORESTAR-241)

Chaque ligne choisit « Quand proposer cette machine ? » : « Toujours » (`ALWAYS`, même si la
machine demandée est libre) ou « Seulement si la machine demandée est occupée »
(`WHEN_OCCUPIED`). Un `displayWhen` absent de la réponse vaut `WHEN_OCCUPIED`. La note devient
le « bénéfice affiché au client » : « Toujours » en exige un (champ signalé, enregistrement
bloqué, le serveur refuse aussi en 400). Le mode est toujours envoyé explicitement et suit la
destination, pas son rang ; une liste héritée affiche les modes effectifs en lecture seule.

Piège de déploiement : un serveur antérieur retire `displayWhen` sans erreur et la sauvegarde
« réussit » avec le mode perdu. L'écran compare donc la réponse à ce qu'il a envoyé et alerte
si un « Toujours » n'est pas revenu. La gestion se livre **après** le serveur. Aucun test
automatisé ne couvre ce composant : preuve par `pnpm run types:check` et parcours navigateur.
