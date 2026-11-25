import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  getRentalEquivalences,
  saveRentalEquivalences,
  RentalEquivalenceConfiguration,
  RentalEquivalenceDisplayWhen,
  RentalEquivalenceEntry,
  RentalEquivalenceList,
} from '../../utils/api';
import { MachineRentedWithImage } from '../../utils/types';

function configurationKey(
  item: Pick<RentalEquivalenceEntry, 'machineId' | 'variantId'>,
) {
  return `${item.machineId}:${item.variantId ?? 'base'}`;
}

const displayWhenOptions: {
  value: RentalEquivalenceDisplayWhen;
  label: string;
}[] = [
  { value: 'ALWAYS', label: 'Toujours' },
  {
    value: 'WHEN_OCCUPIED',
    label: 'Seulement si la machine demandée est occupée',
  },
];

// Une réponse sans mode (ancien serveur) vaut « Seulement si occupée ».
function modeOf(entry: RentalEquivalenceEntry): RentalEquivalenceDisplayWhen {
  return entry.displayWhen ?? 'WHEN_OCCUPIED';
}

// « Toujours » affiche la note au client comme bénéfice : le serveur refuse une note vide.
function missingBenefit(entry: RentalEquivalenceEntry) {
  return modeOf(entry) === 'ALWAYS' && !entry.note.trim();
}

export default function MachineEquivalences({
  machine,
  token,
}: {
  machine: MachineRentedWithImage;
  token: string;
}) {
  const [source, setSource] = useState<number | null>(null);
  const [reload, setReload] = useState(0);
  const [list, setList] = useState<RentalEquivalenceList | null>(null);
  const [configurations, setConfigurations] = useState<
    RentalEquivalenceConfiguration[]
  >([]);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [choice, setChoice] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    setList(null);
    setError('');
    setSaved(false);
    setDirty(false);
    setChoice('');
    getRentalEquivalences(token, Number(machine.id), source).then(
      ({ configurations, labels, ...list }) => {
        if (!active) return;
        setConfigurations(configurations);
        setLabels(labels ?? {});
        setList(list);
      },
      (error: Error) => {
        if (active) setError(error.message);
      },
    );
    return () => {
      active = false;
    };
  }, [machine.id, token, source, reload]);

  const unavailable = (list?.entries ?? [])
    .filter(
      (entry) =>
        !configurations.some(
          (item) => configurationKey(item) === configurationKey(entry),
        ),
    )
    .map((entry) => removedName(entry));

  function removedName(entry: RentalEquivalenceEntry) {
    return (
      labels[configurationKey(entry)] ??
      `machine n° ${entry.machineId}${entry.variantId ? `, variante n° ${entry.variantId}` : ''}`
    );
  }

  function change(patch: Partial<RentalEquivalenceList>) {
    setList((current) => current && { ...current, ...patch });
    setDirty(true);
    setSaved(false);
  }

  async function save() {
    if (!list) return;
    setSaving(true);
    setError('');
    try {
      // Le mode est toujours envoyé explicitement : il suit la destination, pas son rang.
      const entries = list.inherits
        ? []
        : list.entries.map((entry) => ({
            ...entry,
            displayWhen: modeOf(entry),
          }));
      const result = await saveRentalEquivalences(token, Number(machine.id), {
        ...list,
        entries,
      });
      setList(result);
      setDirty(false);
      setSaved(true);
      // Un serveur trop ancien ignore le mode sans erreur : ne pas laisser croire qu'il est gardé.
      if (
        entries.some(
          (entry, index) =>
            entry.displayWhen === 'ALWAYS' &&
            result.entries[index]?.displayWhen !== 'ALWAYS',
        )
      ) {
        setSaved(false);
        setError(
          'Le serveur n’a pas conservé le mode « Toujours ». Rechargez la page puis vérifiez les suggestions.',
        );
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Échec de l’enregistrement.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Stack spacing={2} sx={{ maxWidth: 780 }}>
      <Typography variant="h6">Suggestions de location</Typography>
      <Typography variant="body2">
        Vous choisissez les machines proposées au client et leur ordre. Chaque
        suggestion indique quand elle est proposée ; le bénéfice saisi s’affiche
        sur la vitrine.
      </Typography>
      <TextField
        select
        label="Configuration source"
        value={source ?? 'base'}
        disabled={saving || dirty}
        onChange={(event) =>
          setSource(
            event.target.value === 'base' ? null : Number(event.target.value),
          )
        }
      >
        <MenuItem value="base">Machine de base</MenuItem>
        {machine.variants?.map((variant) => (
          <MenuItem value={variant.id} key={variant.id}>
            {variant.title}
          </MenuItem>
        ))}
      </TextField>
      {error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => setReload(reload + 1)}>
              Recharger
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      {!list && !error && (
        <Typography role="status">Chargement des suggestions…</Typography>
      )}
      {saved && <Alert severity="success">Suggestions enregistrées.</Alert>}
      {!!unavailable.length && (
        <Alert severity="warning">
          {unavailable.length > 1
            ? 'Ces destinations ne sont plus proposées au catalogue'
            : 'Cette destination n’est plus proposée au catalogue'}{' '}
          : {unavailable.join(', ')}.{' '}
          {list?.inherits
            ? 'Retirez-la de la liste de la machine de base.'
            : 'Retirez-la avant d’enregistrer.'}
        </Alert>
      )}
      {list && list.variantId === source && (
        <>
          {source !== null && (
            <TextField
              select
              label="Liste de la variante"
              value={list.inherits ? 'inherited' : 'specific'}
              disabled={saving}
              onChange={(event) =>
                // Une liste spécifique part de la liste héritée affichée :
                // le gestionnaire l'ajuste au lieu de la ressaisir.
                change(
                  event.target.value === 'inherited'
                    ? { inherits: true, entries: [] }
                    : { inherits: false, entries: list.entries },
                )
              }
            >
              <MenuItem value="inherited">Hériter de la machine</MenuItem>
              <MenuItem value="specific">Liste spécifique</MenuItem>
            </TextField>
          )}
          {list.inherits && !!list.entries.length && (
            <Typography variant="body2">
              Liste héritée de la machine : modes et bénéfices sont en lecture
              seule. Modifiez-les depuis la machine de base.
            </Typography>
          )}
          {list.entries.map((entry, index) => {
            const key = configurationKey(entry);
            const name =
              configurations.find((item) => configurationKey(item) === key)
                ?.name ?? `${removedName(entry)} (retirée du catalogue)`;
            const move = (direction: number) => {
              const entries = [...list.entries];
              [entries[index], entries[index + direction]] = [
                entries[index + direction],
                entries[index],
              ];
              change({ entries });
            };
            return (
              <Stack
                key={key}
                spacing={1}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 2,
                }}
              >
                <Typography fontWeight={600}>
                  {index + 1}. {name}
                </Typography>
                <TextField
                  select
                  label="Quand proposer cette machine ?"
                  value={modeOf(entry)}
                  disabled={list.inherits || saving}
                  onChange={(event) =>
                    change({
                      entries: list.entries.map((item, position) =>
                        position === index
                          ? {
                              ...item,
                              displayWhen: event.target
                                .value as RentalEquivalenceDisplayWhen,
                            }
                          : item,
                      ),
                    })
                  }
                >
                  {displayWhenOptions.map((option) => (
                    <MenuItem value={option.value} key={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Bénéfice affiché au client"
                  value={entry.note}
                  disabled={list.inherits || saving}
                  required={modeOf(entry) === 'ALWAYS'}
                  error={missingBenefit(entry)}
                  helperText={
                    missingBenefit(entry)
                      ? '« Toujours » exige un bénéfice : c’est le texte que le client lit sous le nom de la machine.'
                      : undefined
                  }
                  inputProps={{ maxLength: 240 }}
                  onChange={(event) =>
                    change({
                      entries: list.entries.map((item, position) =>
                        position === index
                          ? { ...item, note: event.target.value }
                          : item,
                      ),
                    })
                  }
                />
                {!list.inherits && (
                  <Stack direction="row" flexWrap="wrap">
                    <Button
                      disabled={saving || index === 0}
                      onClick={() => move(-1)}
                    >
                      Monter
                    </Button>
                    <Button
                      disabled={saving || index === list.entries.length - 1}
                      onClick={() => move(1)}
                    >
                      Descendre
                    </Button>
                    <Button
                      color="error"
                      disabled={saving}
                      onClick={() =>
                        change({
                          entries: list.entries.filter(
                            (_, position) => position !== index,
                          ),
                        })
                      }
                    >
                      Retirer
                    </Button>
                  </Stack>
                )}
              </Stack>
            );
          })}
          {!list.entries.length && (
            <Typography variant="body2">
              {list.inherits && dirty
                ? 'La liste de la machine sera appliquée à l’enregistrement.'
                : 'Aucune suggestion manuelle.'}
            </Typography>
          )}
          {!list.inherits && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField
                select
                fullWidth
                label="Machine ou variante à proposer"
                value={choice}
                disabled={saving || list.entries.length >= 50}
                onChange={(event) => setChoice(event.target.value)}
              >
                <MenuItem value="">Sélectionner une configuration</MenuItem>
                {configurations
                  .filter(
                    (item) =>
                      !list.entries.some(
                        (entry) =>
                          configurationKey(entry) === configurationKey(item),
                      ),
                  )
                  .map((item) => (
                    <MenuItem
                      value={configurationKey(item)}
                      key={configurationKey(item)}
                    >
                      {item.name}
                    </MenuItem>
                  ))}
              </TextField>
              <Button
                disabled={!choice || saving}
                onClick={() => {
                  const item = configurations.find(
                    (item) => configurationKey(item) === choice,
                  );
                  if (!item) return;
                  change({
                    entries: [
                      ...list.entries,
                      {
                        machineId: item.machineId,
                        variantId: item.variantId,
                        note: '',
                        displayWhen: 'WHEN_OCCUPIED',
                      },
                    ],
                  });
                  setChoice('');
                }}
              >
                Ajouter
              </Button>
            </Stack>
          )}
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              disabled={
                !dirty ||
                saving ||
                (!list.inherits &&
                  (!!unavailable.length || list.entries.some(missingBenefit)))
              }
              onClick={save}
            >
              Enregistrer les suggestions
            </Button>
            <Button
              disabled={!dirty || saving}
              onClick={() => setReload(reload + 1)}
            >
              Annuler les modifications
            </Button>
          </Stack>
        </>
      )}
    </Stack>
  );
}
