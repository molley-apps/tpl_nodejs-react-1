/**
 * The error / success lines shown inside an auth form.
 */
export default function AuthMessages({ error, notice }: { error: string | null; notice: string | null }) {
  return (
    <>
      {error && (
        <div className="alert alert--error" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="alert alert--success" role="status">
          {notice}
        </div>
      )}
    </>
  );
}
