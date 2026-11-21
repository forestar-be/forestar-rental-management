---
id: equivalences-location
scope: domain
paths: ['src/components/machine/MachineEquivalences.tsx', 'src/pages/SingleMachine.tsx', 'src/utils/api.ts']
tags: [location, forestar-241]
last_reviewed: 2026-11-15
review_after_days: 90
confidence: verified
---

# Équivalences de location dans la fiche machine

L'onglet Équivalences enregistre une liste de destinations publiques orientées et
ordonnées. Une variante peut hériter de la liste de la machine ou choisir une liste
spécifique, y compris vide. La note de chaque destination est visible sur la vitrine.

L'enregistrement utilise le client API authentifié et le jeton CSRF habituel en mode
SSO. Il envoie la révision lue pour la configuration source. Après un conflit de
révision, le bouton Recharger relit la liste du serveur. Les destinations dont la base
est masquée disparaissent des choix physiques du catalogue, tandis que leurs variantes
restent sélectionnables.
